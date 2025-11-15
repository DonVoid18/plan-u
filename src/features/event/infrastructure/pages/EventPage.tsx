"use client";

import {
  CreateEventPayload,
  CreateEventPayloadSchema,
} from "@/features/event/domain/CreateEvent";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/drawer";
import {
  Field,
  FieldError,
} from "@/shared/infrastructure/shadcn/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/popover";
import {
  ArrowUpToLine,
  Calendar as CalendarIcon,
  ChevronsUpDown,
  FileText,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Music,
  PencilLine,
  UserRoundCheck,
  Video,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { createEventAction } from "@/features/event/infrastructure/actions/createEventAction";
import ExcelEmailUploader from "@/features/event/infrastructure/components/ExcelEmailUploader";
import ThemePresetSelect from "@/features/theme-selector-event/infrastructure/components/ThemePresetSelect";
import { useSettings } from "@/features/theme-selector-event/infrastructure/hooks/useSettings";
import { presets } from "@/features/theme-selector-event/infrastructure/utils/theme-presets";
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Calendar } from "@/shared/infrastructure/shadcn/components/ui/calendar";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { Separator } from "@/shared/infrastructure/shadcn/components/ui/separator";
import { Textarea } from "@/shared/infrastructure/shadcn/components/ui/textarea";
import { cn } from "@/shared/infrastructure/shadcn/lib/utils";
import {
  detectLinkType,
  getLocationTypeLabel,
  isValidUrl,
  normalizeUrl,
  type LocationType,
} from "@/shared/infrastructure/utils/detectLinkType";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const availableVideos = [
  { id: "leaves", name: "Hojas", path: "/videos/leaves.mp4" },
  { id: "matrix", name: "Matrix", path: "/videos/matrix.mp4" },
  { id: "fireworks", name: "Fireworks", path: "/videos/fireworks.mp4" },
];

const availableMusic = [
  { id: "sound1", name: "Sonido 1", path: "/sounds/sound1.mp3" },
  { id: "sound2", name: "Sonido 2", path: "/sounds/sound2.mp3" },
];

const EventPage = () => {
  const [isPendingCreate, startTransitionCreate] = useTransition();

  const { applyThemePreset, settings } = useSettings();

  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);
  const [tempLimit, setTempLimit] = useState<string>("");
  const [emailsFile, setEmailsFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Estados para el popover de ubicación
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [detectedType, setDetectedType] = useState<LocationType | null>(null);
  const [locations, setLocations] = useState<
    Array<{ id: string; type: LocationType; url: string }>
  >([]);

  const form = useForm<CreateEventPayload>({
    resolver: zodResolver(CreateEventPayloadSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(new Date().setHours(new Date().getHours() + 1)),
      linkZoom: undefined,
      linkGoogleMeet: undefined,
      linkGoogleMaps: undefined,
      private: false,
      requireApproval: false,
      limitParticipants: null,
      emailsFile: null,
      imageFile: null,
      theme: null,
      sound: null,
      video: null,
    },
  });

  async function onSubmit(event: CreateEventPayload) {
    startTransitionCreate(async () => {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append("title", event.title);
      if (event.description) formData.append("description", event.description);
      formData.append("startDate", event.startDate.toISOString());
      formData.append("endDate", event.endDate.toISOString());
      if (event.linkZoom) formData.append("linkZoom", event.linkZoom);
      if (event.linkGoogleMeet)
        formData.append("linkGoogleMeet", event.linkGoogleMeet);
      if (event.linkGoogleMaps)
        formData.append("linkGoogleMaps", event.linkGoogleMaps);
      formData.append("private", event.private?.toString() || "false");
      formData.append(
        "requireApproval",
        event.requireApproval?.toString() || "false"
      );
      formData.append(
        "limitParticipants",
        event.limitParticipants?.toString() || "null"
      );

      // Agregar theme, sound y video si existen
      if (event.theme) formData.append("theme", event.theme);
      if (event.sound) formData.append("sound", event.sound);
      if (event.video) formData.append("video", event.video);

      // Agregar el archivo Excel si existe
      if (emailsFile) {
        formData.append("emailsFile", emailsFile);
      }

      // Agregar el archivo de imagen si existe
      if (imageFile) {
        formData.append("imageFile", imageFile);
      }

      const response = await createEventAction(formData);
      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);

      // Reset form and state
      form.reset();
      setEmailsFile(null);
      setImageFile(null);
      setImagePreview(null);
    });
  }

  const getSelectedVideoData = () => {
    return availableVideos.find((v) => v.id === selectedVideo);
  };

  const getSelectedMusicData = () => {
    return availableMusic.find((m) => m.id === selectedMusic);
  };

  // Función para manejar cambio de tema
  const handleThemeChange = (preset: string) => {
    applyThemePreset(preset);
    form.setValue("theme", preset);
  };

  // Funciones para manejar ubicaciones
  const handleLocationInputChange = (value: string) => {
    setLocationInput(value);
    if (value.trim()) {
      const type = detectLinkType(value);
      setDetectedType(type);
    } else {
      setDetectedType(null);
    }
  };

  const handleAddLocation = () => {
    if (!locationInput.trim()) {
      toast.error("Por favor ingresa una ubicación");
      return;
    }

    if (!isValidUrl(locationInput)) {
      toast.error("Por favor ingresa una URL válida");
      return;
    }

    const normalizedUrl = normalizeUrl(locationInput);
    const type = detectLinkType(normalizedUrl);

    const newLocation = {
      id: Date.now().toString(),
      type,
      url: normalizedUrl,
    };

    setLocations([...locations, newLocation]);
    setLocationInput("");
    setDetectedType(null);
    setIsLocationPopoverOpen(false);
    toast.success(`Ubicación agregada: ${getLocationTypeLabel(type)}`);
  };

  const handleRemoveLocation = (id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id));
    toast.success("Ubicación eliminada");
  };

  return (
    <div className="min-h-screen p-5 relative">
      {/* Video de fondo para todo el componente */}
      {selectedVideo && (
        <>
          {/* Capa de color de fondo */}
          <div className="fixed inset-0 z-0 bg-primary" />
          {/* Video con blend mode para que el negro se vuelva transparente */}
          <div className="fixed inset-0 z-0">
            <video
              key={selectedVideo}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover mix-blend-lighten"
            >
              <source src={getSelectedVideoData()?.path} type="video/mp4" />
            </video>
          </div>
          {/* Overlay adicional para mejorar la legibilidad */}
          <div className="fixed inset-0 z-0 bg-primary/25 backdrop-blur-sm pointer-events-none" />
        </>
      )}

      {/* Audio de fondo */}
      {selectedMusic && (
        <audio key={selectedMusic} autoPlay loop className="hidden">
          <source src={getSelectedMusicData()?.path} type="audio/mpeg" />
        </audio>
      )}

      {/* Contenido del formulario */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10"
        id="form-create-event"
      >
        {/* Left Section - Image and Theme */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-lg overflow-hidden h-80 shadow-lg bg-primary group">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview del evento"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="https://picsum.photos/1080/720"
                alt="Event decorations"
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    form.setValue("imageFile", file);
                    // Crear preview
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                Cargar imagen
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    form.setValue("imageFile", null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              )}
            </div>
          </div>

          {/* Theme Selector */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex justify-between p-0 px-3 py-7 bg-card/80 backdrop-blur-sm"
                type="button"
              >
                <div className="flex gap-2">
                  <div className="h-10 w-12 overflow-hidden rounded-lg">
                    <img
                      src="https://i.ytimg.com/vi/XG9kptX4aDc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBolv2e3qppO-UPWphygwCJ2llfRw"
                      alt="Event decorations"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <div>Tema</div>
                    <div>Minimalista</div>
                  </div>
                </div>
                <div>
                  <ChevronsUpDown className="w-4 h-4" />
                </div>
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-3/4 p-5 flex flex-col gap-2">
                <DrawerHeader className="p-0">
                  <DrawerTitle />
                </DrawerHeader>
                <div className="flex justify-center gap-4">
                  <button className="flex flex-col items-center gap-1">
                    <div className="h-12 w-20 overflow-hidden rounded-lg border-2 border-primary">
                      <img
                        src="https://i.ytimg.com/vi/XG9kptX4aDc/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLBolv2e3qppO-UPWphygwCJ2llfRw"
                        alt="Event decorations"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-center text-sm font-semibold text-primary">
                      Patrick
                    </div>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ThemePresetSelect
                    presets={presets}
                    currentPreset={null}
                    onPresetChange={handleThemeChange}
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex justify-between cursor-pointer"
                      >
                        <div className="w-full flex justify-between items-center">
                          <div className="flex gap-2 items-center">
                            {/* Video Icon */}
                            <div className="bg-background relative size-[26px] rounded-full border p-1 flex items-center justify-center">
                              <Video className="w-4 h-4" />
                            </div>
                            <span>Fondo</span>
                          </div>
                          <div className="opacity-50">
                            {selectedVideo
                              ? getSelectedVideoData()?.name
                              : "Sin video"}
                          </div>
                        </div>
                        <ChevronsUpDown />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm mb-3">
                          Selecciona un video de fondo
                        </h4>
                        <div className="grid gap-2">
                          {availableVideos.map((video) => (
                            <button
                              key={video.id}
                              onClick={() => {
                                setSelectedVideo(video.id);
                                form.setValue("video", video.id);
                              }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-primary/50",
                                selectedVideo === video.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              )}
                            >
                              <div className="relative w-16 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                                <video
                                  src={video.path}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                              </div>
                              <span className="font-medium text-sm">
                                {video.name}
                              </span>
                              {selectedVideo === video.id && (
                                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-primary-foreground"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedVideo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              setSelectedVideo(null);
                              form.setValue("video", null);
                            }}
                          >
                            Quitar video
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex justify-between cursor-pointer"
                      >
                        <div className="w-full flex justify-between items-center">
                          <div className="flex gap-2 items-center">
                            {/* Music Icon */}
                            <div className="bg-background relative size-[26px] rounded-full border p-1 flex items-center justify-center">
                              <Music className="w-4 h-4" />
                            </div>
                            <span>Música</span>
                          </div>
                          <div className="opacity-50">
                            {selectedMusic
                              ? getSelectedMusicData()?.name
                              : "Sin música"}
                          </div>
                        </div>
                        <ChevronsUpDown />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm mb-3">
                          Selecciona una música de fondo
                        </h4>
                        <div className="grid gap-2">
                          {availableMusic.map((music) => (
                            <button
                              key={music.id}
                              onClick={() => {
                                setSelectedMusic(music.id);
                                form.setValue("sound", music.id);
                              }}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:border-primary/50",
                                selectedMusic === music.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border"
                              )}
                            >
                              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center flex-shrink-0">
                                <Music className="w-6 h-6 text-primary" />
                              </div>
                              <span className="font-medium text-sm">
                                {music.name}
                              </span>
                              {selectedMusic === music.id && (
                                <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <svg
                                    className="w-3 h-3 text-primary-foreground"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path d="M5 13l4 4L19 7"></path>
                                  </svg>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                        {selectedMusic && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => {
                              setSelectedMusic(null);
                              form.setValue("sound", null);
                            }}
                          >
                            Quitar música
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Right Section - Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header with Dropdowns */}
          {/* <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="bg-card/80 backdrop-blur-sm"
            >
              <GitBranch />
              New Branch
              <ChevronDown />
            </Button>
          </div> */}

          {/* Event Title */}
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4">
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nombre del evento"
                    autoComplete="off"
                    className="p-0 border-0 shadow-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 lg:text-3xl font-semibold bg-transparent"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          {/* Description Section */}
          <Dialog
            open={isDescriptionDialogOpen}
            onOpenChange={setIsDescriptionDialogOpen}
          >
            <DialogTrigger asChild>
              <div className="rounded-lg p-4 border cursor-pointer bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-sm font-medium">
                      Agregar descripción
                    </div>
                    {form.watch("description") && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words overflow-hidden">
                        {form.watch("description")}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Descripción del evento</DialogTitle>
                <DialogDescription>
                  Añade una descripción detallada de tu evento. Esto ayudará a
                  los invitados a conocer más sobre lo que pueden esperar.
                </DialogDescription>
              </DialogHeader>
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Textarea
                      {...field}
                      placeholder="Describe tu evento aquí..."
                      className="min-h-[200px] resize-y overflow-wrap-anywhere break-all"
                      aria-invalid={fieldState.invalid}
                      style={{
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDescriptionDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsDescriptionDialogOpen(false)}
                >
                  Guardar descripción
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Date Section */}
          <div className="space-y-4 bg-card/80 backdrop-blur-sm rounded-lg p-4 border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date and Time */}
              <div className="space-y-2">
                <Controller
                  name="startDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <label className="text-sm font-medium block">
                        Fecha de Inicio
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const currentTime = field.value || new Date();
                                date.setHours(currentTime.getHours());
                                date.setMinutes(currentTime.getMinutes());
                                field.onChange(date);
                              }
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* Start Time */}
                <Controller
                  name="startDate"
                  control={form.control}
                  render={({ field }) => {
                    const timeValue = field.value
                      ? `${field.value.getHours().toString().padStart(2, "0")}:${field.value.getMinutes().toString().padStart(2, "0")}`
                      : "00:00";

                    return (
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":");
                          const newDate = new Date(field.value || new Date());
                          newDate.setHours(parseInt(hours));
                          newDate.setMinutes(parseInt(minutes));
                          field.onChange(newDate);
                        }}
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      />
                    );
                  }}
                />
              </div>

              {/* End Date and Time */}
              <div className="space-y-2">
                <Controller
                  name="endDate"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <label className="text-sm font-medium block">
                        Fecha de Fin
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const currentTime = field.value || new Date();
                                date.setHours(currentTime.getHours());
                                date.setMinutes(currentTime.getMinutes());
                                field.onChange(date);
                              }
                            }}
                            disabled={(date) => {
                              const startDate = form.getValues("startDate");
                              return (
                                date <
                                  new Date(new Date().setHours(0, 0, 0, 0)) ||
                                (startDate && date < startDate)
                              );
                            }}
                            initialFocus
                            locale={es}
                          />
                        </PopoverContent>
                      </Popover>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* End Time */}
                <Controller
                  name="endDate"
                  control={form.control}
                  render={({ field }) => {
                    const timeValue = field.value
                      ? `${field.value.getHours().toString().padStart(2, "0")}:${field.value.getMinutes().toString().padStart(2, "0")}`
                      : "00:00";

                    return (
                      <Input
                        type="time"
                        value={timeValue}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":");
                          const newDate = new Date(field.value || new Date());
                          newDate.setHours(parseInt(hours));
                          newDate.setMinutes(parseInt(minutes));
                          field.onChange(newDate);
                        }}
                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                      />
                    );
                  }}
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="space-y-3">
            <Popover
              open={isLocationPopoverOpen}
              onOpenChange={setIsLocationPopoverOpen}
            >
              <PopoverTrigger asChild>
                <div className="rounded-lg p-4 border cursor-pointer bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        Agregar ubicación del evento
                      </div>
                      <div className="text-xs mt-0.5">
                        Ubicación física o enlace virtual
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">
                      Agregar ubicación
                    </h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Ingresa un enlace de Google Maps, Meet, Zoom o Cisco Webex
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Pega aquí el enlace..."
                        value={locationInput}
                        onChange={(e) =>
                          handleLocationInputChange(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddLocation();
                          }
                        }}
                        className="pl-9"
                      />
                    </div>

                    {/* Indicador de tipo detectado */}
                    {detectedType && locationInput.trim() && (
                      <div className="flex items-center gap-2 text-xs bg-primary/10 text-primary px-3 py-2 rounded-md">
                        <span className="font-medium">Detectado:</span>
                        <span>{getLocationTypeLabel(detectedType)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsLocationPopoverOpen(false);
                        setLocationInput("");
                        setDetectedType(null);
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddLocation}
                      className="flex-1"
                    >
                      Agregar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Lista de ubicaciones agregadas */}
            {locations.length > 0 && (
              <div className="space-y-2">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-card/80 backdrop-blur-sm"
                  >
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {getLocationTypeLabel(location.type)}
                      </div>
                      <a
                        href={location.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground hover:text-primary truncate block"
                      >
                        {location.url}
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLocation(location.id)}
                      className="h-8 w-8 p-0 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border">
              Opciones del evento
            </h3>

            <div className="border rounded-lg bg-card/80 backdrop-blur-sm">
              {/* Excel Email Upload */}
              <ExcelEmailUploader
                onFileSelected={(file) => {
                  setEmailsFile(file);
                  form.setValue("emailsFile", file);
                }}
                currentFileName={emailsFile?.name || ""}
              />

              <Separator />

              {/* Approval Option */}
              <button
                className="w-full flex items-center justify-between rounded-lg p-4 cursor-pointer"
                onClick={() => {
                  const newValue = !form.watch("requireApproval");
                  form.setValue("requireApproval", newValue);
                }}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <UserRoundCheck className="text-primary" />
                  <span className="text-sm font-medium">
                    Requiere aprobación
                  </span>
                </div>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    form.watch("requireApproval") ? "bg-primary" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      form.watch("requireApproval")
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </div>
              </button>

              <Separator />

              {/* Cup/Prize Option */}
              <Dialog
                open={isLimitDialogOpen}
                onOpenChange={setIsLimitDialogOpen}
              >
                <DialogTrigger asChild>
                  <button
                    className="w-full flex items-center justify-between rounded-lg p-4 cursor-pointer"
                    type="button"
                    onClick={() => {
                      const currentLimit = form.watch("limitParticipants");
                      setTempLimit(currentLimit?.toString() || "");
                      setIsLimitDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <ArrowUpToLine className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium">Cupo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium opacity-50">
                        {form.watch("limitParticipants")
                          ? `${form.watch("limitParticipants")} personas`
                          : "Ilimitado"}
                      </span>
                      <PencilLine className="text-primary" size={16} />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Límite de participantes</DialogTitle>
                    <DialogDescription>
                      Establece un límite máximo de personas que pueden asistir
                      a tu evento.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="limit-participants"
                        className="text-sm font-medium"
                      >
                        Cantidad de cupos
                      </label>
                      <Input
                        id="limit-participants"
                        type="number"
                        min="1"
                        max="10000"
                        placeholder="Ej: 50"
                        value={tempLimit}
                        onChange={(e) => setTempLimit(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Ingresa un número entre 1 y 10,000
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        form.setValue("limitParticipants", null);
                        setTempLimit("");
                        setIsLimitDialogOpen(false);
                        toast.success("Límite de participantes eliminado");
                      }}
                      className="w-full sm:w-auto"
                    >
                      Eliminar límite
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsLimitDialogOpen(false);
                          setTempLimit("");
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const limit = parseInt(tempLimit);
                          if (isNaN(limit) || limit < 1 || limit > 10000) {
                            toast.error(
                              "Por favor ingresa un número válido entre 1 y 10,000"
                            );
                            return;
                          }
                          form.setValue("limitParticipants", limit);
                          setIsLimitDialogOpen(false);
                          toast.success(
                            `Límite establecido: ${limit} participantes`
                          );
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        Guardar
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Create Event Button */}
          <Button
            type="submit"
            form="form-create-event"
            className="w-full font-semibold py-3 rounded-lg transition shadow-lg"
            size={"lg"}
            disabled={isPendingCreate}
          >
            {isPendingCreate ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin w-5 h-5" />
                Creando...
              </span>
            ) : (
              <span>Crear evento</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EventPage;
