import {
  LayoutDashboard,
  Building2,
  Users,
  WalletCards,
  Settings,
  UserRound,
  UserCheck,
  UserPlus,
  Shield,
  FileText,
  ListTodo,
  Home,
  ClipboardList,
  Calculator,
} from "lucide-react";

export const sidebarSections = [
  // ============================================================
  // BUILDING MANAGEMENT SYSTEM
  // ============================================================
  {
    id: "bms",
    title: "Building Management",
    defaultOpen: true,
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        allowedRoles: ["super_admin", "admin", "lead_manager", "moderator", "employee"],
      },
      {
        title: "Buildings",
        href: "/dashboard/buildings",
        icon: Building2,
        allowedRoles: ["super_admin", "admin", "lead_manager", "moderator"],
      },
      {
        title: "Customers",
        href: "/dashboard/customers",
        icon: UserRound,
        allowedRoles: ["super_admin", "admin", "lead_manager", "moderator"],
      },
      {
        title: "Employees",
        href: "/dashboard/employees",
        icon: UserCheck,
        allowedRoles: ["super_admin", "admin"],
      },
      {
        title: "Leads",
        href: "/dashboard/leads",
        icon: UserPlus,
        allowedRoles: ["super_admin", "admin", "lead_manager", "moderator", "employee"],
      },
      {
        title: "Tasks",
        href: "/dashboard/tasks",
        icon: ListTodo,
        allowedRoles: ["lead_manager", "moderator", "employee"],
      },
      {
        title: "Revenue",
        href: "/dashboard/revenue",
        icon: WalletCards,
        allowedRoles: ["super_admin", "admin", "lead_manager", "moderator"],
      },
      {
        title: "Reports",
        href: "/dashboard/reports",
        icon: FileText,
        allowedRoles: ["super_admin", "admin", "moderator"],
      },
      {
        title: "Users",
        href: "/dashboard/users",
        icon: Shield,
        allowedRoles: ["super_admin", "admin"],
      },
      {
        title: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        allowedRoles: ["super_admin", "admin"],
      },
    ],
  },

  // ============================================================
  // REAL ESTATE MANAGEMENT
  // ============================================================
  {
    id: "real-estate",
    title: "Real Estate Management",
    defaultOpen: false,
    items: [
      {
        title: "Properties",
        href: "/dashboard/real-estate/properties",
        icon: Home,
        allowedRoles: ["super_admin", "admin"],
      },
      {
        title: "Requirements",
        href: "/dashboard/real-estate/requirements",
        icon: ClipboardList,
        allowedRoles: ["super_admin", "admin"],
      },
      {
        title: "Revenue",
        href: "/dashboard/real-estate/revenue",
        icon: WalletCards,
        allowedRoles: ["super_admin", "admin"],
      },
      {
        title: "Tools",
        href: "/dashboard/real-estate/tools",
        icon: Calculator,
        allowedRoles: ["super_admin", "admin"],
      },
    ],
  },
];