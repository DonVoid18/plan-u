interface EventInvitationTemplateProps {
  eventTitle: string;
  eventDescription?: string;
  startDate: string;
  endDate: string;
  qrCodeDataUrl: string;
  eventLink: string;
}

export function EventInvitationTemplate({
  eventTitle,
  eventDescription,
  startDate,
  endDate,
  qrCodeDataUrl,
  eventLink,
}: EventInvitationTemplateProps) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f9fafb",
        padding: "20px",
        color: "#111827",
      }}
    >
      {/* Contenedor central */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        }}
      >
        {/* Header */}
        <h1
          style={{
            fontSize: "26px",
            textAlign: "center",
            marginBottom: "10px",
            color: "#2563eb",
          }}
        >
          🎉 ¡Estás invitado!
        </h1>

        {/* Título del evento */}
        <h2
          style={{
            fontSize: "20px",
            textAlign: "center",
            marginBottom: "20px",
            color: "#111827",
            fontWeight: "bold",
          }}
        >
          {eventTitle}
        </h2>

        {/* Descripción */}
        {eventDescription && (
          <p
            style={{
              fontSize: "15px",
              lineHeight: "1.6",
              marginBottom: "20px",
              color: "#4b5563",
              textAlign: "center",
            }}
          >
            {eventDescription}
          </p>
        )}

        {/* Información del evento */}
        <div
          style={{
            backgroundColor: "#f3f4f6",
            padding: "20px",
            borderRadius: "6px",
            marginBottom: "25px",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <strong style={{ color: "#374151" }}>📅 Inicio:</strong>{" "}
            <span style={{ color: "#6b7280" }}>{startDate}</span>
          </div>
          <div>
            <strong style={{ color: "#374151" }}>📅 Fin:</strong>{" "}
            <span style={{ color: "#6b7280" }}>{endDate}</span>
          </div>
        </div>

        {/* Código QR */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "25px",
          }}
        >
          <p
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              marginBottom: "15px",
              color: "#111827",
            }}
          >
            Tu código QR de acceso
          </p>
          <div
            style={{
              display: "inline-block",
              padding: "20px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              border: "2px solid #e5e7eb",
            }}
          >
            <img
              src={qrCodeDataUrl}
              alt="Código QR de invitación"
              style={{
                width: "200px",
                height: "200px",
                display: "block",
              }}
            />
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "#6b7280",
              marginTop: "10px",
            }}
          >
            Presenta este código QR al ingresar al evento
          </p>
        </div>

        {/* Botón de confirmación */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <a
            href={eventLink}
            style={{
              display: "inline-block",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              padding: "12px 30px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            Ver detalles del evento
          </a>
        </div>

        {/* Footer */}
        <p
          style={{
            fontSize: "13px",
            color: "#6b7280",
            textAlign: "center",
            marginTop: "30px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "20px",
          }}
        >
          ¡Esperamos verte en el evento! Si tienes alguna pregunta, no dudes en
          contactarnos.
        </p>
      </div>
    </div>
  );
}
