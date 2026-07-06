"use client";

import { useMemo, useState } from "react";

interface ProfileState {
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

interface FarmState {
  name: string;
  location: string;
  pondCount: string;
  size: string;
  unit: "Metric (kg, m)" | "Imperial (lb, ft)";
}

interface AccountState {
  username: string;
  email: string;
}

interface NotificationState {
  email: boolean;
  lowFeed: boolean;
  harvest: boolean;
  waterTest: boolean;
}

interface PreferencesState {
  theme: "light" | "dark";
  language: string;
  timezone: string;
  dateFormat: string;
}

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Ponds", href: "/ponds", icon: "pond" },
  { label: "Fish Batches", href: "/batches", icon: "batch" },
  { label: "Today's Feedings", href: "/feedings", icon: "feed" },
  { label: "Feed Inventory", href: "/inventory", icon: "inventory" },
  { label: "Harvest", href: "/harvest", icon: "harvest" },
  { label: "Reports", href: "/reports", icon: "reports" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

type NavIconType = (typeof NAV_ITEMS)[number]["icon"] | "water";

const SECTIONS = [
  { id: "profile", title: "Profile Information", keywords: "profile photo name email phone role" },
  { id: "farm", title: "Farm Details", keywords: "farm name location ponds size measurement unit" },
  { id: "account", title: "Account", keywords: "username email password change" },
  { id: "notifications", title: "Notification Preferences", keywords: "email alerts feed harvest water reminders" },
  { id: "preferences", title: "Preferences", keywords: "theme light dark language timezone date format" },
  { id: "data", title: "Export Data", keywords: "export delete reset danger data" },
  { id: "support", title: "Support", keywords: "contact documentation privacy terms help" },
] as const;

const INITIAL_PROFILE: ProfileState = {
  fullName: "Ayo Okonkwo",
  email: "ayo@greenvalleyfarm.ng",
  phone: "+234 803 456 7890",
  role: "Farm Manager",
};

const INITIAL_FARM: FarmState = {
  name: "Green Valley Fish Farm",
  location: "Ibadan, Oyo State, Nigeria",
  pondCount: "6",
  size: "2.4",
  unit: "Metric (kg, m)",
};

const INITIAL_ACCOUNT: AccountState = {
  username: "ayo.okonkwo",
  email: "ayo@greenvalleyfarm.ng",
};

const INITIAL_NOTIFICATIONS: NotificationState = {
  email: true,
  lowFeed: true,
  harvest: true,
  waterTest: false,
};

const INITIAL_PREFERENCES: PreferencesState = {
  theme: "light",
  language: "English",
  timezone: "Africa/Lagos (WAT)",
  dateFormat: "DD/MM/YYYY",
};

function NavIcon({ type }: { type: NavIconType }): React.JSX.Element {
  const paths: Record<NavIconType, React.ReactNode> = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    pond: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M7 14c2-2 4-2 6 0s4 2 6 0" />
      </>
    ),
    batch: (
      <>
        <path d="M12 3l9 5-9 5-9-5 9-5z" />
        <path d="M3 13l9 5 9-5" />
      </>
    ),
    feed: <path d="M5 12h14M7 8h10M8 16h8" />,
    inventory: (
      <>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
      </>
    ),
    water: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
    harvest: <path d="M4 14c5-8 11-8 16 0M6 14v5h12v-5" />,
    reports: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l4-4 3 3 5-7" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5.5h-4L10.6 8a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2.1 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 2.5h4l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5L19.4 15z" />
      </>
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[type]}
    </svg>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}): React.JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-[var(--color-accent)]" : "bg-neutral-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SettingsCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-[var(--color-border)] bg-white p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:p-6"
    >
      <div className="mb-6 border-b border-[var(--color-border)] pb-5">
        <h2 className="text-lg font-bold tracking-[-0.03em]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>}
      </div>
      {children}
    </section>
  );
}

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]";

export default function SettingsModule(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState<ProfileState>(INITIAL_PROFILE);
  const [profileDraft, setProfileDraft] = useState<ProfileState>(INITIAL_PROFILE);
  const [farmDraft, setFarmDraft] = useState<FarmState>(INITIAL_FARM);
  const [account] = useState<AccountState>(INITIAL_ACCOUNT);
  const [notifications, setNotifications] = useState<NotificationState>(INITIAL_NOTIFICATIONS);
  const [preferences, setPreferences] = useState<PreferencesState>(INITIAL_PREFERENCES);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const visibleSections = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return new Set(SECTIONS.map((s) => s.id));
    return new Set(
      SECTIONS.filter(
        (s) => s.title.toLowerCase().includes(term) || s.keywords.includes(term),
      ).map((s) => s.id),
    );
  }, [query]);

  const show = (id: (typeof SECTIONS)[number]["id"]): boolean => visibleSections.has(id);

  const flashSaved = (message: string): void => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const saveProfile = (): void => {
    setProfile(profileDraft);
    flashSaved("Profile saved.");
  };

  const cancelProfile = (): void => {
    setProfileDraft(profile);
  };

  const updateFarm = (): void => {
    flashSaved("Farm details updated.");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-surface)] text-[var(--color-text-primary)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[256px] border-r border-[var(--color-border)] bg-white/95 px-4 py-5 backdrop-blur-xl lg:block">
        <a href="/dashboard" className="flex items-center gap-2 px-2 transition-opacity duration-200 hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
          <div>
            <p className="text-sm font-bold tracking-[-0.02em]">AquaCore</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">Farm OS</p>
          </div>
        </a>
        <nav className="mt-8 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = item.label === "Settings";
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-all duration-200 hover:bg-[var(--color-surface)] ${
                  active
                    ? "border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] font-medium text-[var(--color-accent)]"
                    : "text-[var(--color-text-secondary)]"
                }`}
              >
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 overflow-x-hidden lg:pl-[256px]">
        <header className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-white/80 backdrop-blur-xl lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white">A</div>
              <span className="text-sm font-bold">Settings</span>
            </div>
            <a href="/dashboard" className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium">Dashboard</a>
          </div>
        </header>

        <div className="mx-auto max-w-[800px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <header className="mb-6">
            <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.04em]">Settings</h1>
            <p className="mt-2 text-base leading-7 text-[var(--color-text-secondary)]">
              Manage your account and farm preferences.
            </p>
          </header>

          {savedMessage && (
            <div className="mb-4 rounded-lg border border-[var(--color-accent-border)] bg-[var(--color-accent-light)] px-4 py-3 text-sm font-medium text-[var(--color-accent)]">
              {savedMessage}
            </div>
          )}

          <div className="mb-6">
            <input
              type="search"
              placeholder="Search settings…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent-border)]"
            />
          </div>

          {visibleSections.size === 0 ? (
            <div className="rounded-2xl border border-[var(--color-border)] bg-white px-6 py-16 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">No settings match your search.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {show("profile") && (
                <SettingsCard id="profile" title="Profile Information" description="Update your personal details.">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-accent-light)] text-xl font-bold text-[var(--color-accent)]">
                      {profileDraft.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <button type="button" className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm font-medium">
                        Change Photo
                      </button>
                      <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">JPG or PNG, max 2 MB</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className="font-medium">Full Name</span>
                      <input type="text" value={profileDraft.fullName} onChange={(e) => setProfileDraft((p) => ({ ...p, fullName: e.target.value }))} className={inputClass} />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Email Address</span>
                      <input type="email" value={profileDraft.email} onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))} className={inputClass} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="font-medium">Phone Number</span>
                        <input type="tel" value={profileDraft.phone} onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))} className={inputClass} />
                      </label>
                      <label className="block text-sm">
                        <span className="font-medium">Role</span>
                        <input type="text" value={profileDraft.role} onChange={(e) => setProfileDraft((p) => ({ ...p, role: e.target.value }))} className={inputClass} />
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={saveProfile} className="min-h-11 rounded-lg bg-[var(--color-accent)] px-5 text-sm font-medium text-white hover:bg-emerald-900">
                      Save Changes
                    </button>
                    <button type="button" onClick={cancelProfile} className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-5 text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                </SettingsCard>
              )}

              {show("farm") && (
                <SettingsCard id="farm" title="Farm Details" description="Information about your fish farm operation.">
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className="font-medium">Farm Name</span>
                      <input type="text" value={farmDraft.name} onChange={(e) => setFarmDraft((f) => ({ ...f, name: e.target.value }))} className={inputClass} />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Farm Location</span>
                      <input type="text" value={farmDraft.location} onChange={(e) => setFarmDraft((f) => ({ ...f, location: e.target.value }))} className={inputClass} />
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="font-medium">Number of Ponds</span>
                        <input type="number" min="1" value={farmDraft.pondCount} onChange={(e) => setFarmDraft((f) => ({ ...f, pondCount: e.target.value }))} className={inputClass} />
                      </label>
                      <label className="block text-sm">
                        <span className="font-medium">Farm Size (hectares)</span>
                        <input type="number" step="0.1" value={farmDraft.size} onChange={(e) => setFarmDraft((f) => ({ ...f, size: e.target.value }))} className={inputClass} />
                      </label>
                    </div>
                    <label className="block text-sm">
                      <span className="font-medium">Preferred Measurement Unit</span>
                      <select value={farmDraft.unit} onChange={(e) => setFarmDraft((f) => ({ ...f, unit: e.target.value as FarmState["unit"] }))} className={inputClass}>
                        <option value="Metric (kg, m)">Metric (kg, m)</option>
                        <option value="Imperial (lb, ft)">Imperial (lb, ft)</option>
                      </select>
                    </label>
                  </div>
                  <div className="mt-6">
                    <button type="button" onClick={updateFarm} className="min-h-11 rounded-lg bg-[var(--color-accent)] px-5 text-sm font-medium text-white hover:bg-emerald-900">
                      Update Farm
                    </button>
                  </div>
                </SettingsCard>
              )}

              {show("account") && (
                <SettingsCard id="account" title="Account" description="Manage your login credentials.">
                  <div className="space-y-4">
                    <label className="block text-sm">
                      <span className="font-medium">Username</span>
                      <input type="text" value={account.username} readOnly className={`${inputClass} bg-[var(--color-surface)] text-[var(--color-text-secondary)]`} />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Email</span>
                      <input type="email" value={account.email} readOnly className={`${inputClass} bg-[var(--color-surface)] text-[var(--color-text-secondary)]`} />
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Password</span>
                      <input type="password" value="••••••••••••" readOnly className={`${inputClass} bg-[var(--color-surface)] text-[var(--color-text-secondary)]`} />
                    </label>
                  </div>
                  <div className="mt-6">
                    <button type="button" onClick={() => setPasswordModalOpen(true)} className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-5 text-sm font-medium">
                      Change Password
                    </button>
                  </div>
                </SettingsCard>
              )}

              {show("notifications") && (
                <SettingsCard id="notifications" title="Notification Preferences" description="Choose what alerts you receive.">
                  <div className="divide-y divide-[var(--color-border)]">
                    <Toggle
                      checked={notifications.email}
                      onChange={(v) => setNotifications((n) => ({ ...n, email: v }))}
                      label="Email Notifications"
                      description="Receive general updates about your farm."
                    />
                    <Toggle
                      checked={notifications.lowFeed}
                      onChange={(v) => setNotifications((n) => ({ ...n, lowFeed: v }))}
                      label="Low Feed Alerts"
                      description="Get notified when feed stock runs low."
                    />
                    <Toggle
                      checked={notifications.harvest}
                      onChange={(v) => setNotifications((n) => ({ ...n, harvest: v }))}
                      label="Harvest Reminders"
                      description="Reminders for upcoming harvest dates."
                    />
                    <Toggle
                      checked={notifications.waterTest}
                      onChange={(v) => setNotifications((n) => ({ ...n, waterTest: v }))}
                      label="Water Test Reminders"
                      description="Prompts to record daily water quality tests."
                    />
                  </div>
                </SettingsCard>
              )}

              {show("preferences") && (
                <SettingsCard id="preferences" title="Preferences" description="Customize how AquaCore looks and behaves.">
                  <div className="space-y-6">
                    <fieldset>
                      <legend className="text-sm font-medium">Theme</legend>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        {(["light", "dark"] as const).map((theme) => (
                          <button
                            key={theme}
                            type="button"
                            onClick={() => setPreferences((p) => ({ ...p, theme }))}
                            className={`min-h-11 flex-1 rounded-lg border px-4 text-sm font-medium capitalize transition-all ${
                              preferences.theme === theme
                                ? "border-[var(--color-accent-border)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                                : "border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"
                            }`}
                          >
                            {theme === "light" ? "Light Mode" : "Dark Mode"}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <label className="block text-sm">
                      <span className="font-medium">Language</span>
                      <select value={preferences.language} onChange={(e) => setPreferences((p) => ({ ...p, language: e.target.value }))} className={inputClass}>
                        <option>English</option>
                        <option>French</option>
                        <option>Portuguese</option>
                        <option>Yoruba</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Time Zone</span>
                      <select value={preferences.timezone} onChange={(e) => setPreferences((p) => ({ ...p, timezone: e.target.value }))} className={inputClass}>
                        <option>Africa/Lagos (WAT)</option>
                        <option>Africa/Nairobi (EAT)</option>
                        <option>UTC</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="font-medium">Date Format</span>
                      <select value={preferences.dateFormat} onChange={(e) => setPreferences((p) => ({ ...p, dateFormat: e.target.value }))} className={inputClass}>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </label>
                  </div>
                </SettingsCard>
              )}

              {show("data") && (
                <SettingsCard id="data" title="Export Data" description="Download or reset your farm data.">
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Export all ponds, batches, feedings, water records, and harvest data as a single file.
                    </p>
                    <button
                      type="button"
                      onClick={() => flashSaved("Data export started.")}
                      className="mt-4 min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-5 text-sm font-medium"
                    >
                      Export All Data
                    </button>
                  </div>
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50/50 p-5">
                    <p className="text-sm font-semibold text-[var(--color-danger)]">Danger Zone</p>
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      These actions are permanent and cannot be undone.
                    </p>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button type="button" className="min-h-11 rounded-lg border border-red-200 bg-white px-5 text-sm font-medium text-[var(--color-danger)]">
                        Delete Account
                      </button>
                      <button type="button" className="min-h-11 rounded-lg border border-red-200 bg-white px-5 text-sm font-medium text-[var(--color-danger)]">
                        Reset Farm Data
                      </button>
                    </div>
                  </div>
                </SettingsCard>
              )}

              {show("support") && (
                <SettingsCard id="support" title="Support" description="Get help and review policies.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { label: "Contact Support", href: "mailto:support@aquacore.app" },
                      { label: "Documentation", href: "#" },
                      { label: "Privacy Policy", href: "#" },
                      { label: "Terms of Service", href: "#" },
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="flex min-h-12 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white px-4 text-sm font-medium transition-all hover:border-[var(--color-accent-border)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </SettingsCard>
              )}
            </div>
          )}
        </div>
      </div>

      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)]">
            <h2 className="text-xl font-bold tracking-[-0.03em]">Change Password</h2>
            <div className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="font-medium">Current Password</span>
                <input type="password" className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">New Password</span>
                <input type="password" className={inputClass} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Confirm New Password</span>
                <input type="password" className={inputClass} />
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setPasswordModalOpen(false)} className="min-h-11 flex-1 rounded-lg border border-[var(--color-border)] text-sm font-medium">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordModalOpen(false);
                  flashSaved("Password updated.");
                }}
                className="min-h-11 flex-1 rounded-lg bg-[var(--color-accent)] text-sm font-medium text-white"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
