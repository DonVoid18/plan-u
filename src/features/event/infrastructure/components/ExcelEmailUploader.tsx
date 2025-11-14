"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/dialog";
import { FileSpreadsheet, Upload } from "lucide-react";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface ExcelEmailUploaderProps {
  onFileSelected: (file: File) => void;
  currentFileName?: string;
}

export default function ExcelEmailUploader({
  onFileSelected,
  currentFileName = "",
}: ExcelEmailUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string>(currentFileName);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensión
    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error(
        "Por favor selecciona un archivo Excel válido (.xlsx o .xls)"
      );
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);
    toast.success(`Archivo "${file.name}" seleccionado`);

    // Limpiar el input
    event.target.value = "";
  };

  const handleConfirm = () => {
    if (!selectedFile) {
      toast.error("Por favor selecciona un archivo");
      return;
    }

    onFileSelected(selectedFile);
    setIsOpen(false);
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileName("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="w-full flex items-center justify-between rounded-lg p-4 cursor-pointer"
          type="button"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium">Cargar correos (Excel)</span>
          </div>
          <div className="flex items-center gap-2">
            {currentFileName && (
              <span className="text-sm font-medium opacity-50 truncate max-w-[150px]">
                {currentFileName}
              </span>
            )}
            <Upload className="text-primary" size={16} />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Cargar correos desde Excel</DialogTitle>
          <DialogDescription>
            Sube un archivo Excel (.xlsx, .xls) con una columna de correos
            electrónicos. La primera columna será procesada.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Área de carga */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 hover:border-primary/50 transition-colors">
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">Selecciona un archivo Excel</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Formatos soportados: .xlsx, .xls
            </p>
            <label htmlFor="excel-upload" className="cursor-pointer">
              <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                <Upload className="w-4 h-4" />
                Seleccionar archivo
              </div>
              <input
                id="excel-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Información del archivo cargado */}
          {fileName && selectedFile && (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFile}
                  className="flex-shrink-0"
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                El archivo se procesará cuando crees el evento
              </p>
            </div>
          )}

          {/* Ejemplo de formato */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">Formato esperado:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="font-mono bg-background p-2 rounded">
                <div>Email (opcional)</div>
                <div>usuario1@ejemplo.com</div>
                <div>usuario2@ejemplo.com</div>
                <div>usuario3@ejemplo.com</div>
              </div>
              <p className="mt-2">
                • Solo se lee la primera columna
                <br />
                • Los encabezados se detectan automáticamente
                <br />• Los correos duplicados o inválidos se omiten
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedFile}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
