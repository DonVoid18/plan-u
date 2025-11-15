import EventCreatedPage from "@/features/event/infrastructure/pages/EventCreatedPage";
import { prisma } from "@/shared/infrastructure/libs/prisma";

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  const eventFound = await prisma.event.findUnique({
    where: { id },
    include: {
      user: true,
      invitations: true,
    },
  });

  if (!eventFound) {
    return <div>Evento no encontrado</div>;
  }

  return <EventCreatedPage event={eventFound} />;
};

export default page;
