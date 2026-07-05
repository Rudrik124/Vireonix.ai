import { supabase } from "@/lib/supabase";
import type { TestingCredentials } from "../shared/types/auth";

export async function createTestingCredentials(
  email: string,
  password: string,
  description: string,
  expiresAt?: string,
  createdBy?: string
): Promise<TestingCredentials | null> {
  try {
    const { data, error } = await supabase.from("testing_credentials").insert([
      {
        email,
        password,
        description,
        created_at: new Date().toISOString(),
        expires_at: expiresAt,
        is_active: true,
        created_by: createdBy,
      },
    ]).select().single();

    if (error) {
      console.error("Error creating testing credentials:", error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      password: data.password,
      description: data.description,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      isActive: data.is_active,
      createdBy: data.created_by,
    };
  } catch (error) {
    console.error("Failed to create testing credentials:", error);
    return null;
  }
}

export async function getTestingCredentials(
  createdBy?: string
): Promise<TestingCredentials[]> {
  try {
    let query = supabase.from("testing_credentials").select("*");

    if (createdBy) {
      query = query.eq("created_by", createdBy);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching testing credentials:", error);
      return [];
    }

    return data.map((cred: any) => ({
      id: cred.id,
      email: cred.email,
      password: cred.password,
      description: cred.description,
      createdAt: cred.created_at,
      expiresAt: cred.expires_at,
      isActive: cred.is_active,
      createdBy: cred.created_by,
    }));
  } catch (error) {
    console.error("Failed to fetch testing credentials:", error);
    return [];
  }
}

export async function deleteTestingCredentials(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("testing_credentials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting testing credentials:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to delete testing credentials:", error);
    return false;
  }
}

export async function updateTestingCredentials(
  id: string,
  updates: Partial<TestingCredentials>
): Promise<TestingCredentials | null> {
  try {
    const updateData: Record<string, any> = {};
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;

    const { data, error } = await supabase
      .from("testing_credentials")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating testing credentials:", error);
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      password: data.password,
      description: data.description,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      isActive: data.is_active,
      createdBy: data.created_by,
    };
  } catch (error) {
    console.error("Failed to update testing credentials:", error);
    return null;
  }
}

export async function validateTestingCredentials(
  email: string,
  password: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("testing_credentials")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return false;
    }

    // Check if expired
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (new Date() > expiresAt) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Failed to validate testing credentials:", error);
    return false;
  }
}
