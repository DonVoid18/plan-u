"use client";

import { useRef, useState } from "react";
import { checkInAction, confirmCheckInAction } from "../actions/checkInAction";

import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";

interface InvitationData {
  id: string;
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
  const lastScanTimeRef = useRef<number>(0);

  const handleScan = async (result: any) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-white text-center mb-8">
            Check-in de Invitados
          </h1>
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
              <div className="aspect-square flex items-center justify-center bg-gray-100">
                <p className="text-gray-600">Cámara en pausa...</p>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="mt-4 text-center text-white">
              <p>Procesando...</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={handleResetScanner}
              disabled={isProcessing || showModal}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔄 Reiniciar Cámara
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showModal && invitationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Confirmar Check-in
            </h2>

            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Evento:</span>{" "}
                {invitationData.eventTitle}
              </p>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Invitado:</span>{" "}
                {invitationData.email}
              </p>

              <div className="border-t pt-4">
                <p className="font-semibold text-gray-800 mb-3">
                  Marcar invitados:
                </p>

                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guest1Checked}
                      onChange={(e) => setGuest1Checked(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isConfirming || invitationData.guest >= 1}
                    />
                    <span
                      className={`text-gray-700 ${invitationData.guest >= 1 ? "line-through opacity-60" : ""}`}
                    >
                      Invitado 1
                      {invitationData.guest >= 1 && (
                        <span className="ml-2 text-green-600 text-sm">
                          (✓ Registrado)
                        </span>
                      )}
                    </span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guest2Checked}
                      onChange={(e) => setGuest2Checked(e.target.checked)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      disabled={isConfirming || invitationData.guest >= 2}
                    />
                    <span
                      className={`text-gray-700 ${invitationData.guest >= 2 ? "line-through opacity-60" : ""}`}
                    >
                      Invitado 2
                      {invitationData.guest >= 2 && (
                        <span className="ml-2 text-green-600 text-sm">
                          (✓ Registrado)
                        </span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Total de asistentes:</span>{" "}
                  {1 + (guest1Checked ? 1 : 0) + (guest2Checked ? 1 : 0)}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isConfirming}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
