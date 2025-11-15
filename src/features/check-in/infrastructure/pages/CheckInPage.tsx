"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/infrastructure/shadcn/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/tabs";
import { BadgeCheckIcon, QrCodeIcon, SearchIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
  checkInAction,
  checkInByDniAction,
  confirmCheckInAction,
} from "../actions/checkInAction";

import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge";
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Checkbox } from "@/shared/infrastructure/shadcn/components/ui/checkbox";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { Separator } from "@/shared/infrastructure/shadcn/components/ui/separator";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";

interface InvitationData {
  id: string;
  dni: string;
  names: string;
  program: string;
  mention: string;
  email: string;
  guest: number;
  eventTitle: string;
  alreadyScanned?: boolean;
  canAddMore?: boolean;
}

export default function CheckInPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [invitationData, setInvitationData] = useState<InvitationData | null>(
    null
  );
  const [guest1Checked, setGuest1Checked] = useState(false);
  const [guest2Checked, setGuest2Checked] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [dni, setDni] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const lastScanTimeRef = useRef<number>(0);

  const handleScan = async (result: Array<{ rawValue: string }>) => {
    if (isProcessing || showModal) return;

    // Prevenir escaneos múltiples en un período corto (debounce de 1.5 segundos)
    const now = Date.now();
    if (now - lastScanTimeRef.current < 1500) {
      return;
    }
    lastScanTimeRef.current = now;

    try {
      setIsProcessing(true);
      const qrData = result[0]?.rawValue;

      if (!qrData) {
        toast.error("No se pudo leer el código QR");
        return;
      }

      const response = await checkInAction(qrData);

      if (response.success && response.data) {
        // Pausar el escáner mientras se procesa
        setScannerEnabled(false);

        // Mostrar modal para confirmar invitados
        setInvitationData(response.data);

        // Configurar checkboxes según el estado actual
        if (response.data.guest === 0) {
          // Ningún invitado registrado
          setGuest1Checked(false);
          setGuest2Checked(false);
          setShowModal(true);
        } else if (response.data.guest === 1) {
          // Invitado 1 ya registrado, permitir marcar invitado 2
          setGuest1Checked(true); // Marcado y deshabilitado
          setGuest2Checked(false);
          setShowModal(true);
          toast.info(response.message);
        } else if (response.data.guest === 2) {
          // Ambos invitados ya registrados
          toast.info(response.message);
          // Reactivar el escáner después de 2 segundos
          setTimeout(() => setScannerEnabled(true), 2000);
        } else {
          setGuest1Checked(false);
          setGuest2Checked(false);
          setShowModal(true);
        }
      } else {
        toast.error(response.message);
        // Reactivar el escáner después de 1 segundo en caso de error
        setTimeout(() => setScannerEnabled(true), 1000);
      }
    } catch (error) {
      console.error("Error al procesar el QR:", error);
      toast.error("Error al procesar el código QR");
      setTimeout(() => setScannerEnabled(true), 1000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!invitationData) return;

    try {
      setIsConfirming(true);

      // Contar cuántos invitados adicionales están marcados
      let guestCount = 0;
      if (guest1Checked) guestCount++;
      if (guest2Checked) guestCount++;

      const response = await confirmCheckInAction(
        invitationData.id,
        guestCount
      );

      if (response.success) {
        toast.success(response.message);
        setShowModal(false);
        setInvitationData(null);
        setGuest1Checked(false);
        setGuest2Checked(false);

        // Reactivar el escáner después de confirmar
        setTimeout(() => setScannerEnabled(true), 1000);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error al confirmar check-in:", error);
      toast.error("Error al confirmar el check-in");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setInvitationData(null);
    setGuest1Checked(false);
    setGuest2Checked(false);

    // Reactivar el escáner después de cancelar
    setTimeout(() => setScannerEnabled(true), 500);
  };

  const handleResetScanner = () => {
    setScannerEnabled(false);
    setTimeout(() => setScannerEnabled(true), 100);
    toast.info("Cámara reiniciada");
  };

  const handleSearchByDni = async () => {
    if (!dni.trim()) {
      toast.error("Por favor ingrese un DNI");
      return;
    }

    if (isSearching || showModal) return;

    try {
      setIsSearching(true);

      // Buscar por DNI usando el nuevo action
      const response = await checkInByDniAction(dni.trim());

      if (response.success && response.data) {
        setInvitationData(response.data);

        // Configurar checkboxes según el estado actual
        if (response.data.guest === 0) {
          setGuest1Checked(false);
          setGuest2Checked(false);
          setShowModal(true);
        } else if (response.data.guest === 1) {
          setGuest1Checked(true);
          setGuest2Checked(false);
          setShowModal(true);
          toast.info(response.message);
        } else if (response.data.guest === 2) {
          toast.info(response.message);
        } else {
          setGuest1Checked(false);
          setGuest2Checked(false);
          setShowModal(true);
        }

        // Limpiar el campo de DNI después de una búsqueda exitosa
        setDni("");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      console.error("Error al buscar por DNI:", error);
      toast.error("Error al buscar el invitado");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">TUMITECH</h1>

          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="qr">
                <QrCodeIcon />
                Escanear QR
              </TabsTrigger>
              <TabsTrigger value="dni">
                <SearchIcon />
                Buscar por DNI
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-4">
              <div className="bg-white rounded-lg shadow-xl overflow-hidden">
                {scannerEnabled ? (
                  <Scanner
                    onScan={handleScan}
                    onError={(error) => console.error(error)}
                    scanDelay={500}
                    constraints={{
                      facingMode: "environment",
                      aspectRatio: 1,
                    }}
                  />
                ) : (
                  <div className="aspect-square flex items-center justify-center">
                    <p>Cámara en pausa...</p>
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="text-center">
                  <p>Procesando...</p>
                </div>
              )}

              <div className="text-center">
                <Button
                  onClick={handleResetScanner}
                  disabled={isProcessing || showModal}
                  className="w-full"
                >
                  Reiniciar Cámara
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="dni" className="space-y-4">
              <div className="bg-white rounded-lg shadow-xl p-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="dni"
                      className="block text-sm font-medium mb-2"
                    >
                      Número de DNI
                    </label>
                    <Input
                      id="dni"
                      type="text"
                      placeholder="Ingrese el DNI del invitado"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchByDni();
                        }
                      }}
                      disabled={isSearching || showModal}
                      maxLength={8}
                    />
                  </div>

                  <Button
                    onClick={handleSearchByDni}
                    disabled={isSearching || showModal || !dni.trim()}
                    className="w-full"
                  >
                    {isSearching ? "Buscando..." : "Buscar Invitado"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de confirmación */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verificación de identidad</DialogTitle>
          </DialogHeader>

          {invitationData && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>DNI</div>
                  <div className="font-semibold">{invitationData.dni}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div>Nombre y apellidos</div>
                  <div className="font-semibold">{invitationData.names}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div>Programa</div>
                  <div className="font-semibold">{invitationData.program}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div>Mención</div>
                  <div className="font-semibold">{invitationData.mention}</div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <div>Correo</div>
                  <div className="font-semibold break-all">
                    {invitationData.email}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold mb-3">Marcar invitados:</p>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={guest1Checked}
                      onCheckedChange={(checked) =>
                        setGuest1Checked(checked === true)
                      }
                      disabled={isConfirming || invitationData.guest >= 1}
                    />
                    <span
                      className={`${invitationData.guest >= 1 ? "line-through opacity-60" : ""}`}
                    >
                      Invitado 1
                      {invitationData.guest >= 1 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-green-500 text-white dark:bg-green-600"
                        >
                          <BadgeCheckIcon />
                          Registrado
                        </Badge>
                      )}
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <Checkbox
                      checked={guest2Checked}
                      onCheckedChange={(checked) =>
                        setGuest2Checked(checked === true)
                      }
                      disabled={isConfirming || invitationData.guest >= 2}
                    />
                    <span
                      className={`${invitationData.guest >= 2 ? "line-through opacity-60" : ""}`}
                    >
                      Invitado 2
                      {invitationData.guest >= 2 && (
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-green-500 text-white dark:bg-green-600"
                        >
                          <BadgeCheckIcon />
                          Registrado
                        </Badge>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total de asistentes:</span>{" "}
                  {1 + (guest1Checked ? 1 : 0) + (guest2Checked ? 1 : 0)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="grid grid-cols-3 gap-2">
            <Button
              onClick={handleCancel}
              disabled={isConfirming}
              variant="outline"
              className="col-span-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="col-span-2"
            >
              {isConfirming ? "Confirmando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
