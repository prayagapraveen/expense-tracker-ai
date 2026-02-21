"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  Mail,
  Cloud,
  Clock,
  History,
  Share2,
  FileText,
  Link2,
  QrCode,
  Copy,
  Check,
  ChevronRight,
  Calendar,
  Zap,
  Shield,
  RefreshCw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Settings,
  Bell,
  Trash2,
  MoreHorizontal,
  Smartphone,
} from "lucide-react";
import { format } from "date-fns";
import { Expense, CATEGORIES, getCategoryMeta } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

// Tab types
type TabId = "quick" | "integrations" | "templates" | "scheduled" | "history" | "share";

// Integration status
type IntegrationStatus = "connected" | "disconnected" | "syncing" | "error";

// Mock data types
interface ExportHistoryItem {
  id: string;
  type: string;
  format: string;
  records: number;
  timestamp: Date;
  destination: string;
  status: "completed" | "failed" | "pending";
  size: string;
}

interface ScheduledExport {
  id: string;
  name: string;
  frequency: "daily" | "weekly" | "monthly";
  destination: string;
  format: string;
  nextRun: Date;
  enabled: boolean;
}

interface CloudExportCenterProps {
  isOpen: boolean;
  onClose: () => void;
  expenses: Expense[];
}

// Cloud service icons (using emoji/text for simplicity)
const serviceIcons: Record<string, { icon: string; color: string; name: string }> = {
  google_sheets: { icon: "📊", color: "#34A853", name: "Google Sheets" },
  google_drive: { icon: "📁", color: "#4285F4", name: "Google Drive" },
  dropbox: { icon: "📦", color: "#0061FF", name: "Dropbox" },
  onedrive: { icon: "☁️", color: "#0078D4", name: "OneDrive" },
  notion: { icon: "📝", color: "#000000", name: "Notion" },
  airtable: { icon: "📋", color: "#18BFFF", name: "Airtable" },
  slack: { icon: "💬", color: "#4A154B", name: "Slack" },
  email: { icon: "✉️", color: "#EA4335", name: "Email" },
};

export function CloudExportCenter({ isOpen, onClose, expenses }: CloudExportCenterProps) {
  const [activeTab, setActiveTab] = useState<TabId>("quick");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Email export state
  const [email, setEmail] = useState("");
  const [emailFormat, setEmailFormat] = useState<"csv" | "pdf" | "xlsx">("pdf");

  // Integration states
  const [integrations, setIntegrations] = useState<Record<string, IntegrationStatus>>({
    google_sheets: "disconnected",
    google_drive: "disconnected",
    dropbox: "connected",
    onedrive: "disconnected",
    notion: "disconnected",
    airtable: "disconnected",
    slack: "connected",
  });

  // Share state
  const [shareLink, setShareLink] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [shareExpiry, setShareExpiry] = useState<"24h" | "7d" | "30d" | "never">("7d");
  const [sharePassword, setSharePassword] = useState(false);

  // Export history (mock data)
  const [exportHistory] = useState<ExportHistoryItem[]>([
    {
      id: "1",
      type: "Monthly Summary",
      format: "PDF",
      records: 47,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      destination: "Email",
      status: "completed",
      size: "245 KB",
    },
    {
      id: "2",
      type: "Full Export",
      format: "CSV",
      records: 156,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      destination: "Google Drive",
      status: "completed",
      size: "89 KB",
    },
    {
      id: "3",
      type: "Tax Report",
      format: "XLSX",
      records: 89,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      destination: "Dropbox",
      status: "completed",
      size: "156 KB",
    },
    {
      id: "4",
      type: "Category Analysis",
      format: "PDF",
      records: 34,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      destination: "Email",
      status: "failed",
      size: "-",
    },
  ]);

  // Scheduled exports (mock data)
  const [scheduledExports, setScheduledExports] = useState<ScheduledExport[]>([
    {
      id: "1",
      name: "Weekly Backup",
      frequency: "weekly",
      destination: "Google Drive",
      format: "CSV",
      nextRun: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      enabled: true,
    },
    {
      id: "2",
      name: "Monthly Report",
      frequency: "monthly",
      destination: "Email",
      format: "PDF",
      nextRun: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      enabled: true,
    },
  ]);

  // Export templates
  const templates = [
    {
      id: "tax_report",
      name: "Tax Report",
      description: "IRS-friendly format with categories and totals",
      icon: "📋",
      fields: ["Date", "Category", "Amount", "Description", "Deductible"],
      popular: true,
    },
    {
      id: "monthly_summary",
      name: "Monthly Summary",
      description: "Overview with charts and category breakdown",
      icon: "📊",
      fields: ["Category Totals", "Trends", "Top Expenses"],
      popular: true,
    },
    {
      id: "category_analysis",
      name: "Category Analysis",
      description: "Deep dive into spending by category",
      icon: "🔍",
      fields: ["Category", "Count", "Total", "Average", "% of Total"],
      popular: false,
    },
    {
      id: "budget_vs_actual",
      name: "Budget vs Actual",
      description: "Compare your spending against budgets",
      icon: "📈",
      fields: ["Category", "Budget", "Actual", "Variance", "Status"],
      popular: false,
    },
    {
      id: "vendor_report",
      name: "Vendor Report",
      description: "Group expenses by merchant/vendor",
      icon: "🏪",
      fields: ["Vendor", "Total Spent", "Visit Count", "Last Visit"],
      popular: false,
    },
    {
      id: "simple_list",
      name: "Simple List",
      description: "Basic export with essential fields only",
      icon: "📝",
      fields: ["Date", "Amount", "Description"],
      popular: false,
    },
  ];

  // Simulate processing
  const simulateProcess = useCallback(async (message: string, successMsg: string) => {
    setIsProcessing(true);
    setProcessingMessage(message);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setShowSuccess(true);
    setSuccessMessage(successMsg);
    setTimeout(() => setShowSuccess(false), 3000);
  }, []);

  // Handle email export
  const handleEmailExport = useCallback(async () => {
    if (!email) return;
    await simulateProcess(
      "Preparing and sending export...",
      `Export sent to ${email}`
    );
  }, [email, simulateProcess]);

  // Handle integration connect
  const handleConnect = useCallback(async (service: string) => {
    setIntegrations((prev) => ({ ...prev, [service]: "syncing" }));
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIntegrations((prev) => ({ ...prev, [service]: "connected" }));
  }, []);

  // Handle integration disconnect
  const handleDisconnect = useCallback((service: string) => {
    setIntegrations((prev) => ({ ...prev, [service]: "disconnected" }));
  }, []);

  // Generate share link
  const generateShareLink = useCallback(async () => {
    await simulateProcess("Generating secure link...", "Share link created!");
    const randomId = Math.random().toString(36).substring(2, 10);
    setShareLink(`https://spendwise.app/share/${randomId}`);
  }, [simulateProcess]);

  // Copy link
  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [shareLink]);

  // Toggle scheduled export
  const toggleScheduledExport = useCallback((id: string) => {
    setScheduledExports((prev) =>
      prev.map((exp) =>
        exp.id === id ? { ...exp, enabled: !exp.enabled } : exp
      )
    );
  }, []);

  // Tabs configuration
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "quick", label: "Quick Export", icon: <Zap className="w-4 h-4" /> },
    { id: "integrations", label: "Integrations", icon: <Cloud className="w-4 h-4" /> },
    { id: "templates", label: "Templates", icon: <FileText className="w-4 h-4" /> },
    { id: "scheduled", label: "Scheduled", icon: <Clock className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <History className="w-4 h-4" /> },
    { id: "share", label: "Share", icon: <Share2 className="w-4 h-4" /> },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-4xl max-h-[85vh] overflow-hidden bg-[rgb(var(--card))] rounded-2xl shadow-2xl border border-[rgb(var(--border))] m-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border))] bg-gradient-to-r from-brand-600 to-emerald-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Export Center</h2>
                <p className="text-sm text-white/80">
                  {expenses.length} expenses ready to export
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Processing overlay */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--card))]/90 backdrop-blur-sm"
              >
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-brand-500 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">{processingMessage}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success notification */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex h-[calc(85vh-88px)]">
            {/* Sidebar tabs */}
            <div className="w-48 border-r border-[rgb(var(--border))] p-3 space-y-1 bg-[rgb(var(--muted))]/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300"
                      : "hover:bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}

              {/* Sync status */}
              <div className="pt-4 mt-4 border-t border-[rgb(var(--border))]">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-[rgb(var(--muted-foreground))]">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  2 services connected
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Quick Export Tab */}
              {activeTab === "quick" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Quick Export</h3>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">
                      Export your data instantly via email or download
                    </p>
                  </div>

                  {/* Email Export */}
                  <div className="p-5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                        <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <h4 className="font-medium">Email Export</h4>
                        <p className="text-sm text-[rgb(var(--muted-foreground))]">
                          Send export directly to your inbox
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        className="w-full px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />

                      <div className="flex gap-2">
                        {(["csv", "pdf", "xlsx"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            onClick={() => setEmailFormat(fmt)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                              emailFormat === fmt
                                ? "bg-brand-600 text-white"
                                : "bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]"
                            )}
                          >
                            {fmt.toUpperCase()}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleEmailExport}
                        disabled={!email}
                        className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-600 to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        Send to Email
                      </button>
                    </div>
                  </div>

                  {/* Quick Download */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { format: "CSV", icon: "📄", desc: "Spreadsheet" },
                      { format: "JSON", icon: "📦", desc: "Raw data" },
                      { format: "PDF", icon: "📑", desc: "Report" },
                    ].map((item) => (
                      <button
                        key={item.format}
                        onClick={() => simulateProcess(`Generating ${item.format}...`, `${item.format} downloaded!`)}
                        className="p-4 rounded-xl border border-[rgb(var(--border))] hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all text-center group"
                      >
                        <span className="text-2xl mb-2 block">{item.icon}</span>
                        <span className="font-medium block">{item.format}</span>
                        <span className="text-xs text-[rgb(var(--muted-foreground))]">
                          {item.desc}
                        </span>
                        <Download className="w-4 h-4 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === "integrations" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Cloud Integrations</h3>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">
                      Connect your favorite apps for seamless exports
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(serviceIcons).map(([key, service]) => {
                      const status = integrations[key] || "disconnected";
                      return (
                        <div
                          key={key}
                          className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{service.icon}</span>
                              <div>
                                <h4 className="font-medium">{service.name}</h4>
                                <div className="flex items-center gap-1.5 text-xs">
                                  <div
                                    className={cn(
                                      "w-2 h-2 rounded-full",
                                      status === "connected" && "bg-green-500",
                                      status === "disconnected" && "bg-gray-400",
                                      status === "syncing" && "bg-yellow-500 animate-pulse",
                                      status === "error" && "bg-red-500"
                                    )}
                                  />
                                  <span className="text-[rgb(var(--muted-foreground))] capitalize">
                                    {status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {status === "connected" ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => simulateProcess(`Syncing to ${service.name}...`, "Export complete!")}
                                className="flex-1 py-2 px-3 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
                              >
                                Export Now
                              </button>
                              <button
                                onClick={() => handleDisconnect(key)}
                                className="p-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))] transition-colors"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>
                          ) : status === "syncing" ? (
                            <div className="flex items-center justify-center gap-2 py-2 text-sm text-[rgb(var(--muted-foreground))]">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Connecting...
                            </div>
                          ) : (
                            <button
                              onClick={() => handleConnect(key)}
                              className="w-full py-2 rounded-lg border border-[rgb(var(--border))] text-sm font-medium hover:bg-[rgb(var(--muted))] transition-colors"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* API Access */}
                  <div className="p-4 rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--muted))]/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">API Access</h4>
                        <p className="text-sm text-[rgb(var(--muted-foreground))]">
                          Build custom integrations with our REST API
                        </p>
                      </div>
                      <button className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors">
                        Get API Key
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === "templates" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Export Templates</h3>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">
                      Pre-configured exports for common use cases
                    </p>
                  </div>

                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-4 rounded-xl border border-[rgb(var(--border))] hover:border-brand-500 transition-colors group cursor-pointer"
                        onClick={() => simulateProcess(`Generating ${template.name}...`, `${template.name} ready!`)}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{template.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{template.name}</h4>
                              {template.popular && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-medium">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-[rgb(var(--muted-foreground))]">
                              {template.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.fields.map((field) => (
                                <span
                                  key={field}
                                  className="px-2 py-0.5 rounded bg-[rgb(var(--muted))] text-xs"
                                >
                                  {field}
                                </span>
                              ))}
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[rgb(var(--muted-foreground))] group-hover:text-brand-600 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create custom template */}
                  <button className="w-full p-4 rounded-xl border border-dashed border-[rgb(var(--border))] hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all flex items-center justify-center gap-2 text-[rgb(var(--muted-foreground))] hover:text-brand-600">
                    <span className="text-xl">+</span>
                    Create Custom Template
                  </button>
                </div>
              )}

              {/* Scheduled Tab */}
              {activeTab === "scheduled" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Scheduled Exports</h3>
                      <p className="text-sm text-[rgb(var(--muted-foreground))]">
                        Automate your backups and reports
                      </p>
                    </div>
                    <button className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      New Schedule
                    </button>
                  </div>

                  <div className="space-y-3">
                    {scheduledExports.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "p-3 rounded-xl",
                                schedule.enabled
                                  ? "bg-brand-100 dark:bg-brand-900/30"
                                  : "bg-[rgb(var(--muted))]"
                              )}
                            >
                              <RefreshCw
                                className={cn(
                                  "w-5 h-5",
                                  schedule.enabled
                                    ? "text-brand-600 dark:text-brand-400"
                                    : "text-[rgb(var(--muted-foreground))]"
                                )}
                              />
                            </div>
                            <div>
                              <h4 className="font-medium">{schedule.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted-foreground))]">
                                <span className="capitalize">{schedule.frequency}</span>
                                <span>•</span>
                                <span>{schedule.format}</span>
                                <span>•</span>
                                <span>{schedule.destination}</span>
                              </div>
                              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                                Next run: {format(schedule.nextRun, "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toggleScheduledExport(schedule.id)}
                              className={cn(
                                "relative w-12 h-6 rounded-full transition-colors",
                                schedule.enabled ? "bg-brand-600" : "bg-[rgb(var(--muted))]"
                              )}
                            >
                              <div
                                className={cn(
                                  "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                  schedule.enabled ? "left-7" : "left-1"
                                )}
                              />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info box */}
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Stay notified
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You&apos;ll receive email notifications when scheduled exports complete or fail.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === "history" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Export History</h3>
                      <p className="text-sm text-[rgb(var(--muted-foreground))]">
                        View and re-download previous exports
                      </p>
                    </div>
                    <button className="text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]">
                      Clear history
                    </button>
                  </div>

                  <div className="space-y-2">
                    {exportHistory.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "p-2 rounded-lg",
                                item.status === "completed"
                                  ? "bg-green-100 dark:bg-green-900/30"
                                  : item.status === "failed"
                                  ? "bg-red-100 dark:bg-red-900/30"
                                  : "bg-yellow-100 dark:bg-yellow-900/30"
                              )}
                            >
                              {item.status === "completed" ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                              ) : item.status === "failed" ? (
                                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              ) : (
                                <Loader2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400 animate-spin" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{item.type}</h4>
                              <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted-foreground))]">
                                <span>{item.format}</span>
                                <span>•</span>
                                <span>{item.records} records</span>
                                <span>•</span>
                                <span>{item.destination}</span>
                                {item.size !== "-" && (
                                  <>
                                    <span>•</span>
                                    <span>{item.size}</span>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">
                                {format(item.timestamp, "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.status === "completed" && (
                              <button className="p-2 rounded-lg hover:bg-[rgb(var(--muted))] transition-colors">
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                            {item.status === "failed" && (
                              <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                                Retry
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Tab */}
              {activeTab === "share" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Share Your Data</h3>
                    <p className="text-sm text-[rgb(var(--muted-foreground))]">
                      Generate secure links to share your expense data
                    </p>
                  </div>

                  {/* Share options */}
                  <div className="p-5 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--muted))]/30 space-y-4">
                    <h4 className="font-medium">Link Settings</h4>

                    {/* Expiry */}
                    <div>
                      <label className="block text-sm text-[rgb(var(--muted-foreground))] mb-2">
                        Link expires in
                      </label>
                      <div className="flex gap-2">
                        {(["24h", "7d", "30d", "never"] as const).map((exp) => (
                          <button
                            key={exp}
                            onClick={() => setShareExpiry(exp)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                              shareExpiry === exp
                                ? "bg-brand-600 text-white"
                                : "bg-[rgb(var(--muted))] hover:bg-[rgb(var(--border))]"
                            )}
                          >
                            {exp === "never" ? "Never" : exp}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Password protection */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Password Protection
                        </h4>
                        <p className="text-sm text-[rgb(var(--muted-foreground))]">
                          Require password to access shared data
                        </p>
                      </div>
                      <button
                        onClick={() => setSharePassword(!sharePassword)}
                        className={cn(
                          "relative w-12 h-6 rounded-full transition-colors",
                          sharePassword ? "bg-brand-600" : "bg-[rgb(var(--muted))]"
                        )}
                      >
                        <div
                          className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                            sharePassword ? "left-7" : "left-1"
                          )}
                        />
                      </button>
                    </div>

                    <button
                      onClick={generateShareLink}
                      className="w-full py-3 rounded-lg bg-gradient-to-r from-brand-600 to-emerald-600 text-white font-medium hover:opacity-90 transition-opacity"
                    >
                      Generate Share Link
                    </button>
                  </div>

                  {/* Generated link */}
                  {shareLink && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                        <span className="font-medium text-brand-900 dark:text-brand-100">
                          Your share link is ready!
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={shareLink}
                          readOnly
                          className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm"
                        />
                        <button
                          onClick={copyLink}
                          className={cn(
                            "px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2",
                            linkCopied
                              ? "bg-green-500 text-white"
                              : "bg-brand-600 text-white hover:bg-brand-700"
                          )}
                        >
                          {linkCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowQR(!showQR)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-sm font-medium hover:bg-[rgb(var(--muted))] transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          {showQR ? "Hide" : "Show"} QR Code
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] text-sm font-medium hover:bg-[rgb(var(--muted))] transition-colors">
                          <Smartphone className="w-4 h-4" />
                          Send to Phone
                        </button>
                      </div>

                      {/* QR Code placeholder */}
                      <AnimatePresence>
                        {showQR && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex justify-center pt-4"
                          >
                            <div className="w-48 h-48 bg-white rounded-xl p-4 flex items-center justify-center border border-[rgb(var(--border))]">
                              {/* Simulated QR code pattern */}
                              <div className="w-full h-full grid grid-cols-8 grid-rows-8 gap-0.5">
                                {Array.from({ length: 64 }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "rounded-sm",
                                      Math.random() > 0.5 ? "bg-black" : "bg-white"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Share via apps */}
                  <div>
                    <h4 className="font-medium mb-3">Share directly to</h4>
                    <div className="flex gap-3">
                      {["slack", "email"].map((app) => (
                        <button
                          key={app}
                          onClick={() => simulateProcess(`Sharing via ${serviceIcons[app].name}...`, "Shared successfully!")}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))] transition-colors"
                        >
                          <span>{serviceIcons[app].icon}</span>
                          <span className="font-medium">{serviceIcons[app].name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
