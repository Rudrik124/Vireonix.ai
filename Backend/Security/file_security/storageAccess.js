import { createClient } from "@supabase/supabase-js";

const getStorageConfig = () => ({
  url: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  serviceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "",
  bucket: process.env.SUPABASE_STORAGE_BUCKET || "user-assets",
  defaultExpiresIn: Number(process.env.SUPABASE_STORAGE_SIGNED_URL_TTL_SECONDS || 300),
});

const getSupabaseStorageClient = () => {
  const { url, serviceRoleKey } = getStorageConfig();
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase storage credentials are not configured.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const ensurePrivateBucket = async (bucketName = getStorageConfig().bucket) => {
  const client = getSupabaseStorageClient();
  const { error } = await client.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 50 * 1024 * 1024,
  });

  if (error && error.message && !error.message.includes("already exists")) {
    throw error;
  }

  return { success: true, bucket: bucketName };
};

export const uploadToPrivateStorage = async ({ bucketName, path, fileBuffer, contentType, userId }) => {
  const client = getSupabaseStorageClient();
  const targetBucket = bucketName || getStorageConfig().bucket;
  const targetPath = path || `${userId || "anonymous"}/${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const { data, error } = await client.storage.from(targetBucket).upload(targetPath, fileBuffer, {
    contentType,
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return { success: true, path: data?.path || targetPath, bucket: targetBucket };
};

export const createSignedUrl = async ({ bucketName, path, expiresIn = getStorageConfig().defaultExpiresIn, userId }) => {
  const client = getSupabaseStorageClient();
  const targetBucket = bucketName || getStorageConfig().bucket;
  const targetPath = path;

  if (!targetPath) {
    throw new Error("Storage path is required for signed URL generation.");
  }

  const { data, error } = await client.storage.from(targetBucket).createSignedUrl(targetPath, expiresIn);
  if (error) {
    throw error;
  }

  return {
    success: true,
    signedUrl: data?.signedUrl || null,
    expiresIn,
    bucket: targetBucket,
    path: targetPath,
    userId,
  };
};

export const validateStorageAccess = async ({ bucketName, path, userId, isAdmin = false }) => {
  if (!path) {
    return { allowed: false, reason: "PATH_REQUIRED" };
  }

  if (isAdmin) {
    return { allowed: true, reason: "ADMIN_ACCESS" };
  }

  const isOwnerPath = String(path).includes(`${userId}/`) || String(path).startsWith(`${userId}/`);
  return {
    allowed: Boolean(userId && isOwnerPath),
    reason: userId && isOwnerPath ? "OWNER_ACCESS" : "ACCESS_DENIED",
  };
};

export const deleteFromPrivateStorage = async ({ bucketName, path, userId, isAdmin = false }) => {
  const access = await validateStorageAccess({ bucketName, path, userId, isAdmin });
  if (!access.allowed) {
    throw new Error("Access denied for this storage operation.");
  }

  const client = getSupabaseStorageClient();
  const targetBucket = bucketName || getStorageConfig().bucket;
  const { data, error } = await client.storage.from(targetBucket).remove([path]);
  if (error) {
    throw error;
  }

  return { success: true, deleted: data?.length || 0, bucket: targetBucket };
};

export default {
  ensurePrivateBucket,
  uploadToPrivateStorage,
  createSignedUrl,
  validateStorageAccess,
  deleteFromPrivateStorage,
};
