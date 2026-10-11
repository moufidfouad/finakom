import { prisma } from "@/config/prisma";
import { AppError } from "@/utils/AppError";
import { sendCandidateContactNotification } from "@/modules/email/email.service";
import { ContactCandidateInput } from "./contactCandidate.schemas";

/**
 * Transmet un message à un candidat via son CV publié — l'email réel du
 * candidat n'est récupéré qu'ICI, côté serveur, jamais renvoyé au client.
 * Vérifie explicitement que le CV est toujours "Public" (pas seulement
 * qu'il existe) : sans ça, connaître un ancien identifiant de CV permettrait
 * de contacter un candidat qui a délibérément dépublié son profil.
 */
export async function contactCandidate(
  cvId: string,
  input: Omit<ContactCandidateInput, "website">,
) {
  const cv = await prisma.candidateCv.findFirst({
    where: { id: cvId, visibility: "Public" },
    include: { candidate: { select: { email: true, fullName: true } } },
  });
  if (!cv) throw AppError.notFound("CV introuvable");

  await sendCandidateContactNotification({
    candidateEmail: cv.candidate.email,
    candidateFullName: cv.candidate.fullName,
    senderName: input.senderName,
    senderEmail: input.senderEmail,
    message: input.message,
  });
}
