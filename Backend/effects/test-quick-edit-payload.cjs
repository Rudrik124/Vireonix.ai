// Test script to verify backend payload parsing for Quick Edit effects
const parsedEditorSelections = {
  media: {
    items: [
      { id: "clip-1", type: "video", duration: 5, effect: "none", filter: "none" },
      { id: "clip-2", type: "video", duration: 4, effect: "shake", filter: "none" },
      { id: "clip-3", type: "video", duration: 3, effect: "velocity", filter: "none" }
    ],
    count: 3
  }
};

const resolvedEditorSelections = {
  ...parsedEditorSelections
};

const mediaFiles = [
  { originalname: "file1.mp4", path: "path1.mp4" },
  { originalname: "file2.mp4", path: "path2.mp4" },
  { originalname: "file3.mp4", path: "path3.mp4" }
];

for (let i = 0; i < mediaFiles.length; i++) {
  const media = mediaFiles[i];
  const mediaMeta = resolvedEditorSelections?.media?.items?.[i] || {};
  const clipEffect = mediaMeta?.effect && mediaMeta.effect !== "none" ? mediaMeta.effect : "none";
  console.log(`Clip ${i}: ${media.originalname} -> effect: ${clipEffect}`);
}
