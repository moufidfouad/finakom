/**
 * Messages de contact — modèle global (aucun lien à une entreprise, reçus via
 * le formulaire public du site), appelé une seule fois pour tout le seed,
 * jamais par entreprise. Mix lu/non lu pour tester la page d'administration.
 */
import { PrismaClient } from "@prisma/client";

export async function seedContactMessages(prisma: PrismaClient) {
  const messages = [
    {
      fullName: "Nadia Boina",
      email: "nadia.boina@example.km",
      subject: "Question sur la tarification",
      message:
        "Bonjour, je souhaiterais savoir si FINAKOM propose une offre adaptée aux très petites entreprises. Merci d'avance pour votre retour.",
      isRead: true,
    },
    {
      fullName: "Chaharane Mmadi",
      email: "chaharane.m@example.km",
      subject: "Problème de connexion",
      message:
        "Je n'arrive plus à me connecter à mon compte depuis hier, le message d'erreur indique un email non vérifié alors que je l'ai bien confirmé.",
      isRead: true,
    },
    {
      fullName: "Toiwilou Ali",
      email: "toiwilou.ali@example.km",
      subject: "Demande de démonstration",
      message:
        "Nous gérons trois entreprises familiales et aimerions organiser une démonstration de la plateforme avant de nous engager.",
      isRead: false,
    },
    {
      fullName: "Fahmi Abdérémane",
      email: "fahmi.a@example.km",
      subject: "Export comptable",
      message:
        "Est-il possible d'exporter le grand livre au format compatible avec un logiciel de comptabilité tiers ?",
      isRead: false,
    },
  ];
  for (const m of messages) {
    await prisma.contactMessage.create({ data: m });
  }
}
