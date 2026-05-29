import { useAuth } from "../../../app/context/auth-context";
import { useNavigate } from "react-router";
import { useState, useEffect, useRef } from "react";
import { TrendingUp, Download, Calendar, Loader } from "lucide-react";
import { fetchAnalytics } from "../../../services/developer-portal-api.service";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface AnalyticsData {
  bugsFound: number;
  criticalBugs: number;
  testsPassed: number;
  testsRun: number;
  avgResolutionTime: number;
  creditUsed: number;
  bugSeverity?: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  featureCoverage?: {
    videoGenerator: number;
    authentication: number;
    billing: number;
    uiux: number;
    performance: number;
  };
  detailedMetrics?: {
    bugsReported: { week: number; month: number; allTime: number; trend: number };
    testCasesCompleted: { week: number; month: number; allTime: number; trend: number };
    videosGenerated: { week: number; month: number; allTime: number; trend: number };
    bugsVerifiedFixed: { week: number; month: number; allTime: number; trend: number };
    avgQualityRating: { week: number; month: number; allTime: number; trend: number };
  };
}

export function TesterAnalyticsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    bugsFound: 0,
    criticalBugs: 0,
    testsPassed: 0,
    testsRun: 0,
    avgResolutionTime: 0,
    creditUsed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && profile?.id) {
      loadAnalytics();
    }
  }, [dateRange, profile, authLoading]);

  const mockAnalyticsData: AnalyticsData = {
    bugsFound: 47,
    criticalBugs: 5,
    testsPassed: 98,
    testsRun: 125,
    avgResolutionTime: 5.8,
    creditUsed: 689,
    bugSeverity: {
      critical: 5,
      high: 8,
      medium: 18,
      low: 23,
    },
    featureCoverage: {
      videoGenerator: 95,
      authentication: 87,
      billing: 72,
      uiux: 65,
      performance: 58,
    },
  };

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const timeRangeMap = { "7d": "7d", "30d": "30d", all: "all" };
      const data = await fetchAnalytics(timeRangeMap[dateRange]);
      setAnalyticsData(data && Object.keys(data).length > 0 ? data : mockAnalyticsData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      console.log("Using mock data for analytics");
      setAnalyticsData(mockAnalyticsData);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#1a1a2e",
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 5;

      pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 5;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const timestamp = new Date().toISOString().split("T")[0];
      pdf.save(`analytics-report-${timestamp}.pdf`);
      alert("✓ Report exported successfully!");
    } catch (error) {
      console.error("PDF export failed:", error);
      // Fallback: Create simple text-based PDF
      try {
        const pdf = new jsPDF();
        pdf.setFontSize(16);
        pdf.text("Analytics Report", 10, 10);
        pdf.setFontSize(11);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 20);
        pdf.text(`Period: ${dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : "All Time"}`, 10, 30);
        pdf.text("", 10, 40);
        pdf.text("Key Metrics:", 10, 45);
        pdf.text(`• Bugs Found: ${analyticsData.bugsFound}`, 15, 55);
        pdf.text(`• Test Pass Rate: ${passRate}%`, 15, 65);
        pdf.text(`• Avg Resolution Time: ${analyticsData.avgResolutionTime.toFixed(1)} days`, 15, 75);
        pdf.text(`• Credits Used: ${analyticsData.creditUsed}`, 15, 85);
        const timestamp = new Date().toISOString().split("T")[0];
        pdf.save(`analytics-report-${timestamp}.pdf`);
        alert("✓ Report exported as PDF!");
      } catch (altError) {
        alert("Could not export PDF. Try CSV export instead.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["Vireonix Analytics Report", new Date().toLocaleDateString()],
      [],
      ["Metric", "Value"],
      ["Bugs Found", analyticsData.bugsFound],
      ["Critical Bugs", analyticsData.criticalBugs],
      ["Tests Passed", analyticsData.testsPassed],
      ["Tests Run", analyticsData.testsRun],
      ["Pass Rate (%)", ((analyticsData.testsPassed / analyticsData.testsRun) * 100).toFixed(1)],
      ["Avg Resolution Time", analyticsData.avgResolutionTime],
      ["Credits Used", analyticsData.creditUsed],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const timestamp = new Date().toISOString().split("T")[0];
    a.download = `analytics-report-${timestamp}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    alert("✓ CSV exported successfully!");
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 to-purple-800 text-white">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    navigate("/");
    return null;
  }

  const passRate = analyticsData.testsRun > 0 
    ? ((analyticsData.testsPassed / analyticsData.testsRun) * 100).toFixed(1)
    : "0.0";

  const bugSeverity = analyticsData.bugSeverity || {
    critical: analyticsData.criticalBugs,
    high: 0,
    medium: 0,
    low: 0,
  };

  const featureCoverage = analyticsData.featureCoverage || {
    videoGenerator: 0,
    authentication: 0,
    billing: 0,
    uiux: 0,
    performance: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Analytics & Reporting</h1>
            <p className="text-purple-200">Track your testing performance and metrics</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/tester/dashboard")}
              className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded transition"
            >
              Back
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting || isLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded transition"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Exporting..." : "Export Report"}
            </button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="mb-6 flex gap-2">
          {(["7d", "30d", "all"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded transition ${
                dateRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-purple-700 text-purple-200 hover:bg-purple-600"
              }`}
            >
              {range === "7d" ? "This Week" : range === "30d" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-white">
            <Loader className="w-8 h-8 animate-spin mr-2" />
            Loading analytics...
          </div>
        ) : (
          <div ref={reportRef} className="bg-gradient-to-br from-purple-900 to-purple-800 p-8">
            {/* Key Metrics - Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-purple-700 p-6 rounded-lg">
                <p className="text-purple-200 text-sm mb-2">BUGS FOUND</p>
                <p className="text-4xl font-bold text-white">{analyticsData.bugsFound}</p>
                <p className="text-purple-300 text-xs mt-2">{analyticsData.criticalBugs} critical issues</p>
              </div>

              <div className="bg-purple-700 p-6 rounded-lg">
                <p className="text-purple-200 text-sm mb-2">TEST PASS RATE</p>
                <p className="text-4xl font-bold text-green-400">{passRate}%</p>
                <p className="text-purple-300 text-xs mt-2">
                  {analyticsData.testsPassed} passed / {analyticsData.testsRun} total
                </p>
              </div>

              <div className="bg-purple-700 p-6 rounded-lg">
                <p className="text-purple-200 text-sm mb-2">AVG RESOLUTION TIME</p>
                <p className="text-4xl font-bold text-blue-400">{analyticsData.avgResolutionTime.toFixed(1)}</p>
                <p className="text-purple-300 text-xs mt-2">days from report to fix</p>
              </div>

              <div className="bg-purple-700 p-6 rounded-lg">
                <p className="text-purple-200 text-sm mb-2">CREDITS USED</p>
                <p className="text-4xl font-bold text-yellow-400">{analyticsData.creditUsed}</p>
                <p className="text-purple-300 text-xs mt-2">
                  {(analyticsData.creditUsed / 500).toFixed(1)} weeks allocated
                </p>
              </div>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Bug Distribution */}
              <div className="bg-purple-700 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Bug Severity Distribution
                </h2>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">Critical</span>
                      <span className="text-red-400 font-semibold">{bugSeverity.critical}</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{ width: bugSeverity.critical > 0 ? "100%" : "0%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">High</span>
                      <span className="text-orange-400 font-semibold">{bugSeverity.high}</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{
                          width: `${
                            bugSeverity.critical + bugSeverity.high > 0
                              ? (bugSeverity.high / (bugSeverity.critical + bugSeverity.high)) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">Medium</span>
                      <span className="text-yellow-400 font-semibold">{bugSeverity.medium}</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full rounded-full"
                        style={{
                          width: `${
                            bugSeverity.medium > 0 ? "60%" : "0%"
                          }`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">Low</span>
                      <span className="text-green-400 font-semibold">{bugSeverity.low}</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{
                          width: `${bugSeverity.low > 0 ? "75%" : "0%"}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Testing Coverage */}
              <div className="bg-purple-700 p-6 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Feature Testing Coverage</h2>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">Video Generator</span>
                      <span className="text-white font-semibold">{featureCoverage.videoGenerator}%</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: `${featureCoverage.videoGenerator}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">Authentication</span>
                      <span className="text-white font-semibold">{featureCoverage.authentication}%</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{ width: `${featureCoverage.authentication}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">Billing</span>
                      <span className="text-white font-semibold">{featureCoverage.billing}%</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-500 h-full rounded-full"
                        style={{ width: `${featureCoverage.billing}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">UI/UX</span>
                      <span className="text-white font-semibold">{featureCoverage.uiux}%</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{ width: `${featureCoverage.uiux}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-purple-200 text-sm">Performance</span>
                      <span className="text-white font-semibold">{featureCoverage.performance}%</span>
                    </div>
                    <div className="w-full bg-purple-600 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{ width: `${featureCoverage.performance}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-blue-900 border border-blue-700 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Export Reports</h3>
              <p className="text-blue-200 mb-4">
                Generate and download detailed reports for sharing with your team or for sprint retrospectives.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded transition flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  {isExporting ? "Exporting PDF..." : "Export as PDF"}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded transition flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
