import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState } from "react";
import { Search, BookOpen, AlertCircle, CheckCircle, AlertTriangle, FileText } from "lucide-react";

interface GuideSection {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
  icon: any;
}

export function TesterDocumentationPage() {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const guides: GuideSection[] = [
    {
      id: "DOC-001",
      title: "Getting Started - First Day Checklist",
      category: "Onboarding",
      content: `
## Welcome to the Tester Portal!

### Your First Day Checklist
1. ✓ Set up your profile with timezone and contact info
2. ✓ Review severity classification standards
3. ✓ Complete the video generation testing tutorial
4. ✓ File your first test report
5. ✓ Join the Slack testing channel

### Key Resources
- Testing Guidelines: See Severity Classification below
- Video Generation Best Practices: See Video Testing Prompts below
- Common Issues FAQ: Available in Help section
      `,
      updatedAt: "2026-05-20",
      icon: CheckCircle,
    },
    {
      id: "DOC-002",
      title: "Severity Classification Guide",
      category: "Standards",
      content: `
## How to Rate Bug Severity

### Critical (Red)
- System crashes or data loss
- Security vulnerability
- Complete feature failure
- Payment/billing broken
- Example: "App crashes on every video generation"

### High (Orange)
- Major feature partially broken
- Significant performance issue
- Workaround available but difficult
- Example: "Video generation times out 50% of the time"

### Medium (Yellow)
- Feature works but with issues
- Minor performance problem
- Edge case not working
- Example: "Custom seed parameter not persisting"

### Low (Green)
- UI/UX improvement needed
- Cosmetic issue
- No functional impact
- Example: "Button text is cut off on mobile"
      `,
      updatedAt: "2026-05-18",
      icon: AlertTriangle,
    },
    {
      id: "DOC-003",
      title: "Video Generation Testing Best Practices",
      category: "Video Testing",
      content: `
## Prompts & Parameters

### Good Test Prompts
- ✓ Specific and descriptive: "A golden retriever running on a beach at sunset"
- ✓ Include details: "Cinematic style, 4K resolution, smooth motion"
- ✓ Test edge cases: "Very long complex multi-scene action sequence"

### Bad Prompts
- ✗ Too vague: "Make a video"
- ✗ Contradictory: "Frozen flames melting"
- ✗ Offensive content (will be rejected)

### Parameter Testing Strategy
1. Test each style: realistic, cinematic, artistic, anime, 3d
2. Test resolution ranges: 720p, 1080p, 2K, 4K
3. Test durations: 5s, 15s, 30s, 60s
4. Use seeds for reproducibility
5. Compare outputs across builds

### Common Issues to Check
- Prompt understanding accuracy
- Motion smoothness
- Color accuracy
- Artifact detection
- Consistency across runs with same seed
      `,
      updatedAt: "2026-05-22",
      icon: BookOpen,
    },
    {
      id: "DOC-004",
      title: "Bug Report Template",
      category: "Reporting",
      content: `
## How to Write Effective Bug Reports

### Required Fields
1. **Title**: Short, specific description
   - Good: "Video generation timeout on prompts >300 chars"
   - Bad: "Bug in video generation"

2. **Severity**: Use classification guide above

3. **Component**: Which feature is affected?
   - Video Generator, Auth, Billing, UI, etc.

4. **Steps to Reproduce**: Clear, numbered steps
   - Include exact inputs and parameters
   - Include screenshots if relevant

5. **Expected vs Actual Result**
   - Expected: What should happen
   - Actual: What actually happened

6. **Environment**
   - OS, Browser, Device type
   - App version (if applicable)

### Attachments
- Screenshots (highlight the issue)
- Screen recordings (show the problem in action)
- Console logs (if applicable)
- Generated files (if relevant)

### Example
Title: "Video generation fails with Unicode characters in prompt"
Steps:
1. Enter prompt: "A cat eating café sushi 🍣"
2. Select 1080p resolution
3. Click Generate
Expected: Video generates successfully
Actual: Error: Invalid prompt (internal error)
      `,
      updatedAt: "2026-05-19",
      icon: FileText,
    },
    {
      id: "DOC-005",
      title: "Changelog - Latest Updates",
      category: "Releases",
      content: `
## Build 2026.5.28 - Latest Deployment

### New Features
✓ Video comparison tool (side-by-side, current vs previous)
✓ Automated duplicate bug detection
✓ Credit rollover policy (unused balance carries over)
✓ Batch test case execution

### Improvements
✓ 40% faster video generation in 1080p
✓ Better error messages
✓ Improved UI responsiveness on mobile
✓ Enhanced search in documentation

### Bug Fixes
✓ Fixed: Seed parameter not working on 4K
✓ Fixed: Credits not updating in real-time
✓ Fixed: Test case status not persisting

### Known Issues
⚠ 4K resolution may timeout on very complex prompts
⚠ Notification emails delayed by 1-2 minutes
⚠ Feature flag toggles require page refresh

---

## Build 2026.5.20 - Previous

### New Features
✓ Real-time notifications
✓ Testing credits system
✓ Analytics dashboard
      `,
      updatedAt: "2026-05-28",
      icon: AlertCircle,
    },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const categories = ["all", ...new Set(guides.map((g) => g.category))];
  const filteredGuides = guides.filter((guide) => {
    const matchesSearch =
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || guide.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedGuide = filteredGuides.length > 0 ? filteredGuides[0] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Documentation & Guidelines</h1>
            <p className="text-purple-200">Testing standards, best practices, and onboarding</p>
          </div>
          <button
            onClick={() => navigate("/tester/dashboard")}
            className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Search & Categories */}
          <div className="lg:col-span-1">
            <div className="bg-purple-700 p-6 rounded-lg sticky top-8">
              <h2 className="text-xl font-semibold text-white mb-4">Browse</h2>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded text-white bg-purple-600 placeholder-purple-300"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <p className="text-purple-200 text-sm font-semibold mb-3">Categories</p>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded transition ${
                      selectedCategory === category
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-purple-200 hover:bg-purple-600"
                    }`}
                  >
                    {category === "all" ? "All Articles" : category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Articles List & Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Articles List */}
              <div className="lg:col-span-1">
                <h3 className="text-lg font-semibold text-white mb-4">Articles</h3>
                <div className="space-y-3">
                  {filteredGuides.map((guide) => (
                    <button
                      key={guide.id}
                      onClick={() => {
                        /* Guide selection handled by display */
                      }}
                      className="w-full text-left bg-purple-700 hover:bg-purple-600 p-4 rounded transition"
                    >
                      <div className="flex items-start gap-2">
                        <guide.icon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="text-white font-semibold text-sm">{guide.title}</h4>
                          <p className="text-purple-300 text-xs mt-1">{guide.category}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Display */}
              {selectedGuide && (
                <div className="lg:col-span-2">
                  <div className="bg-purple-700 p-6 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <selectedGuide.icon className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                        <div>
                          <h2 className="text-2xl font-bold text-white">{selectedGuide.title}</h2>
                          <p className="text-purple-300 text-sm mt-1">{selectedGuide.category}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-purple-300 text-xs mb-4">
                      Last updated: {selectedGuide.updatedAt}
                    </p>

                    <div className="prose prose-invert max-w-none">
                      <div className="text-purple-200 space-y-4">
                        {selectedGuide.content.split("\n").map((line, idx) => {
                          if (line.startsWith("## ")) {
                            return (
                              <h3 key={idx} className="text-white text-lg font-bold mt-4 mb-2">
                                {line.replace("## ", "")}
                              </h3>
                            );
                          }
                          if (line.startsWith("### ")) {
                            return (
                              <h4 key={idx} className="text-white text-base font-semibold mt-3 mb-2">
                                {line.replace("### ", "")}
                              </h4>
                            );
                          }
                          if (line.trim().startsWith("- ") || line.trim().startsWith("✓") || line.trim().startsWith("✗")) {
                            return (
                              <p key={idx} className="ml-4">
                                {line.trim()}
                              </p>
                            );
                          }
                          if (line.trim().startsWith("1. ") || line.trim().startsWith("2. ")) {
                            return (
                              <p key={idx} className="ml-4">
                                {line.trim()}
                              </p>
                            );
                          }
                          if (line.trim()) {
                            return <p key={idx}>{line}</p>;
                          }
                          return null;
                        })}
                      </div>
                    </div>

                    {/* Helpful Actions */}
                    <div className="mt-6 pt-4 border-t border-purple-600">
                      <p className="text-purple-300 text-sm mb-3">Was this helpful?</p>
                      <div className="flex gap-2">
                        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition">
                          👍 Yes
                        </button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition">
                          👎 No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
