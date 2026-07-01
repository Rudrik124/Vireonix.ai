// Test script to verify Stability AI integration
import dotenv from "dotenv";
dotenv.config();

const stabilityApiKey = process.env.STABILITY_API_KEY;

console.log("🧪 Testing Stability AI Integration");
console.log("=====================================");
console.log(`API Key present: ${stabilityApiKey ? "✅ YES" : "❌ NO"}`);
console.log(`API Key length: ${stabilityApiKey ? stabilityApiKey.length : 0}`);
console.log(`API Key prefix: ${stabilityApiKey ? stabilityApiKey.substring(0, 20) + "..." : "N/A"}`);

// Test FormData availability
console.log("\n🔍 Testing FormData availability:");
try {
  const testFormData = new FormData();
  console.log("✅ FormData is available");
} catch (e) {
  console.log("❌ FormData not available:", e.message);
}

// Test fetch availability
console.log("\n🔍 Testing fetch availability:");
if (typeof fetch === "function") {
  console.log("✅ fetch is available");
} else {
  console.log("❌ fetch not available");
}

// Test the actual API call
async function testStabilityAI() {
  console.log("\n🚀 Testing Stability AI API call:");
  
  if (!stabilityApiKey) {
    console.log("❌ API key not set in .env");
    return;
  }

  // Try different endpoints
  const endpoints = [
    { url: "https://api.stability.ai/v2beta/stable-image/generate", name: "v2beta stable-image" },
    { url: "https://api.stability.ai/v2beta/stable-image/generate/ultra", name: "v2beta stable-image/ultra" },
    { url: "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", name: "v1 text-to-image" },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📍 Trying endpoint: ${endpoint.name}`);
    
    try {
      const formData = new FormData();
      formData.append("prompt", "a robot teaching students");
      formData.append("output_format", "png");

      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${stabilityApiKey}`,
          "Accept": "application/json"
        },
        body: formData
      });

      console.log(`   Status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 150)}`);
        continue;
      }

      const data = await response.json();
      
      if (data.image) {
        console.log(`   ✅ SUCCESS! Image generated`);
        console.log(`   Image size: ${data.image.length} chars`);
        return;
      } else {
        console.log(`   ⚠️  No image field in response`);
        console.log(`   Response keys: ${Object.keys(data).join(", ")}`);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

testStabilityAI();
