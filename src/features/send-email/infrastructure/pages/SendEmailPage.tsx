"use client";

import {
  Alert,
  AlertDescription,
} from "@/shared/infrastructure/shadcn/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/infrastructure/shadcn/components/ui/card";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  XCircle,
} from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { Label } from "@/shared/infrastructure/shadcn/components/ui/label";
import { sendMassEmailAction } from "../actions/sendMassEmailAction";

const SendEmailPage = () => {
  const [eventId, setEventId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      total: number;
      successful: number;
      failed: number;
      results: Array<{ email: string; success: boolean; error?: string }>;
    };
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventId.trim()) {
      setResult({
        success: false,
        message: "Por favor, ingresa un ID de evento válido",
      });
      return;
    }

    setResult(null);

    startTransition(async () => {
      const response = await sendMassEmailAction({ eventId: eventId.trim() });
      setResult(response);
    });
  };

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-6" />
            Envío Masivo de Invitaciones
          </CardTitle>
          <CardDescription>
            Envía invitaciones por correo electrónico a todos los invitados de
            un evento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="eventId">ID del Evento</Label>
              <Input
                id="eventId"
                type="text"
                placeholder="Ingresa el ID del evento"
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                disabled={isPending}
                className="max-w-md"
              />
              <p className="text-sm text-muted-foreground">
                Ingresa el ID del evento para enviar invitaciones a todos sus
                invitados
              </p>
            </div>

            <Button type="submit" disabled={isPending || !eventId.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Enviando correos...
                </>
              ) : (
                <>
                  <Mail />
                  Enviar Invitaciones
                </>
              )}
            </Button>
          </form>

          {/* Resultados */}
          {result && (
            <div className="mt-6 space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <XCircle className="size-4" />
                )}
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>

              {result.details && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen del Envío</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-primary">
                          {result.details.total}
                        </p>
                        <p className="text-sm text-muted-foreground">Total</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-green-600">
                          {result.details.successful}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Exitosos
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-red-600">
                          {result.details.failed}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Fallidos
                        </p>
                      </div>
                    </div>

                    {result.details.failed > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <AlertCircle className="size-4 text-destructive" />
                          Correos fallidos:
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-3">
                          {result.details.results
                            .filter((r) => !r.success)
                            .map((r, idx) => (
                              <div
                                key={idx}
                                className="text-sm flex items-start gap-2"
                              >
                                <XCircle className="size-4 text-destructive shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium">{r.email}</p>
                                  {r.error && (
                                    <p className="text-muted-foreground text-xs">
                                      {r.error}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {result.details.successful > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                          <CheckCircle2 className="size-4" />
                          Correos enviados exitosamente:
                        </div>
                        <div className="max-h-40 overflow-y-auto space-y-1 rounded-md border p-3">
                          {result.details.results
                            .filter((r) => r.success)
                            .map((r, idx) => (
                              <div
                                key={idx}
                                className="text-sm flex items-center gap-2"
                              >
                                <CheckCircle2 className="size-4 text-green-600 shrink-0" />
                                <p>{r.email}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SendEmailPage;
