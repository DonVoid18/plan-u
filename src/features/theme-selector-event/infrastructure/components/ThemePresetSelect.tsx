// React Imports

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { ThemePreset, ThemeStyleProps } from "../../domain/theme";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { useMemo } from "react";
import { defaultThemeState } from "../config/theme";

type ThemePresetSelectProps = {
  presets: Record<string, ThemePreset>;
  currentPreset: string | null;
  onPresetChange: (preset: string) => void;
};

const ThemePresetSelect = ({
  presets,
  currentPreset,
  onPresetChange,
}: ThemePresetSelectProps) => {
  const presetNames = useMemo(() => {
    // First get all preset names
    const allPresets = Object.keys(presets);

    // Separate presets with badges and those without
    const presetsWithBadges = allPresets.filter(
      (name) => presets[name]?.meta?.badge
    );
    const presetsWithoutBadges = allPresets.filter(
      (name) => !presets[name]?.meta?.badge
    );

    // Sort each group alphabetically
    presetsWithBadges.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    presetsWithoutBadges.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );

    // Always keep 'default' as the first item in the list without badges
    return [
      "default",
      ...presetsWithBadges,
      ...presetsWithoutBadges.filter((name) => name !== "default"),
    ];
  }, [presets]);

  const value = presetNames?.find((name) => name === currentPreset);

  // Helper function to get theme color
  const getThemeColor = (themeName: string, color: keyof ThemeStyleProps) => {
    // If it's default theme, use the first preset as default
    const theme =
      themeName === "default" ? defaultThemeState : presets[themeName];

    return theme?.light?.[color] || theme?.dark?.[color] || "#000000";
  };

  // Helper function to get badge for a theme
  const getThemeBadge = (themeName: string) => {
    if (themeName === "default") return null;

    return presets[themeName]?.meta?.badge || null;
  };

  return (
    <div className="flex flex-col gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex justify-between cursor-pointer"
          >
            <div className="w-full flex justify-between items-center">
              <div className="flex gap-2 items-center">
                {/* Theme Color Grid Icon */}
                <div className="bg-background relative size-[26px] rounded-full border p-1">
                  <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[2px]">
                    <div
                      className="rounded-[2px]"
                      style={{
                        backgroundColor: getThemeColor(
                          value || "default",
                          "primary"
                        ),
                      }}
                    />
                    <div
                      className="rounded-[2px]"
                      style={{
                        backgroundColor: getThemeColor(
                          value || "default",
                          "destructive"
                        ),
                      }}
                    />
                    <div
                      className="rounded-[2px]"
                      style={{
                        backgroundColor: getThemeColor(
                          value || "default",
                          "secondary"
                        ),
                      }}
                    />
                    <div
                      className="rounded-full"
                      style={{
                        backgroundColor: getThemeColor(
                          value || "default",
                          "accent"
                        ),
                      }}
                    />
                  </div>
                </div>
                <span>Tema</span>
              </div>
              <div className="opacity-50">
                {value
                  ? value
                      .replace(/-/g, " ")
                      .replace(/\b\w/g, (char) => char.toUpperCase())
                  : "Seleccionar tema"}
              </div>
            </div>
            <ChevronsUpDown />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] p-4 overflow-y-auto" align="start">
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4">
              {presetNames.map((name) => {
                const isSelected = value === name;

                return (
                  <button
                    key={name}
                    onClick={() => onPresetChange(name)}
                    className="group relative flex flex-col items-center gap-2 transition-all cursor-pointer"
                  >
                    {/* Theme Color Circle */}
                    <div
                      className={`
                        relative size-16 rounded-full overflow-hidden
                        transition-all
                        ${
                          isSelected
                            ? "ring-4 ring-primary ring-offset-2 shadow-lg"
                            : "ring-2 ring-border hover:ring-primary/50"
                        }
                      `}
                    >
                      <div className="grid h-full w-full grid-cols-2 grid-rows-2">
                        <div
                          style={{
                            backgroundColor: getThemeColor(name, "primary"),
                          }}
                        />
                        <div
                          style={{
                            backgroundColor: getThemeColor(name, "destructive"),
                          }}
                        />
                        <div
                          style={{
                            backgroundColor: getThemeColor(name, "secondary"),
                          }}
                        />
                        <div
                          style={{
                            backgroundColor: getThemeColor(name, "accent"),
                          }}
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    {/* Theme Name */}
                    <span
                      className={`
                      text-xs text-center font-medium max-w-full truncate
                      ${isSelected ? "text-primary" : "text-muted-foreground"}
                    `}
                    >
                      {name
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ThemePresetSelect;
