import { User, event } from "@prisma/client";

interface EventCreatedPageProps {
  event: event & {
    user: User;
  };
}

const EventCreatedPage = ({ event }: EventCreatedPageProps) => {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Imagen del evento */}
        {event.image && (
          <div className="w-full h-64 relative">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Título y descripción */}
          <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
          {event.description && (
            <p className="text-gray-700 mb-6">{event.description}</p>
          )}

          {/* Información de fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-600">Fecha de inicio</h3>
              <p>{new Date(event.startDate).toLocaleString("es-ES")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-600">Fecha de fin</h3>
              <p>{new Date(event.endDate).toLocaleString("es-ES")}</p>
            </div>
          </div>

          {/* Enlaces */}
          <div className="mb-6">
            {event.linkZoom && (
              <div className="mb-2">
                <h3 className="font-semibold text-gray-600">Zoom</h3>
                <a
                  href={event.linkZoom}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {event.linkZoom}
                </a>
              </div>
            )}
            {event.linkGoogleMeet && (
              <div className="mb-2">
                <h3 className="font-semibold text-gray-600">Google Meet</h3>
                <a
                  href={event.linkGoogleMeet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {event.linkGoogleMeet}
                </a>
              </div>
            )}
            {event.linkGoogleMaps && (
              <div className="mb-2">
                <h3 className="font-semibold text-gray-600">Ubicación</h3>
                <a
                  href={event.linkGoogleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {event.linkGoogleMaps}
                </a>
              </div>
            )}
          </div>

          {/* Configuración del evento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-gray-600">Tipo</h3>
              <p>{event.private ? "Privado" : "Público"}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-600">
                Aprobación requerida
              </h3>
              <p>{event.requireApproval ? "Sí" : "No"}</p>
            </div>
            {event.limitParticipants && (
              <div>
                <h3 className="font-semibold text-gray-600">
                  Límite de participantes
                </h3>
                <p>{event.limitParticipants}</p>
              </div>
            )}
            {event.theme && (
              <div>
                <h3 className="font-semibold text-gray-600">Tema</h3>
                <p>{event.theme}</p>
              </div>
            )}
          </div>

          {/* Multimedia */}
          {event.sound && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-600 mb-2">Sonido</h3>
              <audio controls className="w-full">
                <source src={event.sound} />
              </audio>
            </div>
          )}
          {event.video && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-600 mb-2">Video</h3>
              <video controls className="w-full max-h-96">
                <source src={event.video} />
              </video>
            </div>
          )}

          {/* Información del creador */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-600">Creado por</h3>
            <p>{event.user.name || event.user.email}</p>
            <p className="text-sm text-gray-500">
              Creado el {new Date(event.createdAt).toLocaleString("es-ES")}
            </p>
            <p className="text-sm text-gray-500">
              Última actualización:{" "}
              {new Date(event.updatedAt).toLocaleString("es-ES")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCreatedPage;
