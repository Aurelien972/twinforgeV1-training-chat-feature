/*
  # Activer Realtime pour user_token_balance

  ## Problème résolu
  Le widget TokenBalanceWidget ne se mettait pas à jour en temps réel après consommation de tokens.
  La table user_token_balance n'était pas dans la publication Realtime.

  ## Solution
  Ajouter user_token_balance à la publication supabase_realtime pour permettre
  les notifications en temps réel au widget frontend.

  ## Impact
  - Le widget affiche maintenant le solde correct immédiatement après consommation
  - Plus besoin d'attendre le polling (30 secondes)
  - Amélioration de l'UX pour les utilisateurs

  ## Sécurité
  - La table a déjà des politiques RLS restrictives
  - Seul l'utilisateur authentifié peut voir son propre solde
  - Aucune donnée sensible n'est exposée
*/

-- Activer Realtime pour user_token_balance
ALTER PUBLICATION supabase_realtime ADD TABLE user_token_balance;

-- Vérifier l'activation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'user_token_balance'
  ) THEN
    RAISE NOTICE '✅ Realtime successfully enabled for user_token_balance';
  ELSE
    RAISE EXCEPTION '❌ Failed to enable Realtime for user_token_balance';
  END IF;
END $$;
