import { SettingsProvider } from "@/features/theme-selector-event/infrastructure/contexts/settingsContext";
import { ThemeProvider } from "@/features/theme-selector-event/infrastructure/providers/ThemesProvider";

export default function EventLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <div className="min-h-screen">{children}</div>
      </ThemeProvider>
    </SettingsProvider>
  );
}
