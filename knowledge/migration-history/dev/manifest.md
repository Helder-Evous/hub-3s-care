# Manifesto de migrations — DEV

- **Ambiente:** DEV
- **Project ID:** `xcqfdnymadeqeuacqotu`
- **Total de migrations registradas:** 12
- **Fonte:** `supabase_migrations.schema_migrations` (consulta read-only, 2026-06-25)
- **SHA-256:** calculado sobre o conteúdo bruto de `statements` — itens do array unidos por LF (U+000A), na ordem original, sem newline final. Idêntico ao hash computado no banco via `encode(digest(array_to_string(statements, E'\n'),'sha256'),'hex')`.
- **Rollback:** nenhuma migration registrada possui conteúdo em `rollback` (todas vazias).

| Version | Name | Statements | Rollback | SHA-256 | Equivalente no GitHub | Classificação |
| ------- | ---- | ---------: | -------: | ------- | --------------------- | ------------- |
| `20260623135741` | `dev_scaffold_public_clinics` | 1 | 0 | `3e8280e2c21ce48500cfb8918b1e9e7c4b1b8f6cd481a9c08bfe63acd0db01fe` | Ausente | exclusivo do ambiente |
| `20260623135758` | `crm_001_schema_and_grants` | 1 | 0 | `13415113f8f659c71bd9891c65b30b0c8f1e99aba3b387e0350198ac3bfdb635` | Ausente | CRM protegido (idêntico ao principal por hash) |
| `20260623135832` | `crm_002_enums_and_lead_sources` | 1 | 0 | `e9a1985d12024de77eff0aab32964e0586e8415ef723d2b2b0675b1ac0819479` | Ausente | CRM protegido (idêntico ao principal por hash) |
| `20260623135853` | `crm_003_access_model` | 1 | 0 | `677879b78d8ce8227c9d594b0412ccc223f0077722667351e5715688752f7b90` | Ausente | CRM protegido (idêntico ao principal por hash) |
| `20260623135919` | `crm_004_helpers_and_rls` | 1 | 0 | `db3d02cb113e241457a19aece75820d09bf89b38eb8f7b6e6488cebe8cf95391` | Ausente | CRM protegido; divergência histórica textual (vs principal) |
| `20260623135941` | `crm_005_patients` | 1 | 0 | `9075b8087073afeb8e6f5693a006a5566f8d656398c8cc57fd001358d0b0227a` | Ausente | CRM protegido; divergência histórica textual (vs principal) |
| `20260623135959` | `crm_006_leads` | 1 | 0 | `a623eeb062a0b7944eb8a3cdd528b0985dd51ea072fb6369344069fcdde2ecd1` | Ausente | CRM protegido; divergência histórica textual (vs principal) |
| `20260623140017` | `crm_007_lead_activities` | 1 | 0 | `e4032807f6a2b6761fbf6cb6f5fa5f56b13b3674f99660a8e5b1bf298e26e456` | Ausente | CRM protegido; divergência histórica textual (vs principal) |
| `20260623140045` | `crm_008_appointments` | 1 | 0 | `9918efd383a019aba38a6b71dc2a610644ad956a6055ee827bded77dc6f4aef4` | Ausente | CRM protegido; divergência histórica textual (vs principal) |
| `20260623140106` | `crm_009_budgets` | 1 | 0 | `262847f32f350c602d52fe462f1dcf180fbccfa878b07d10edcb4e10da92973b` | Ausente | CRM protegido; divergência histórica textual (vs principal) |
| `20260623140136` | `crm_010_stage_derivation` | 1 | 0 | `85e1decdae540a4f95fdccb74fb643099f621fb2028d4e465ed2f11f574b6423` | Ausente | CRM protegido; divergência histórica textual (vs principal) |
| `20260623192204` | `crm_011_api_grants` | 1 | 0 | `ab49e281e835ac41573faabe603fbfd398944a830954dfdb610ba0e63cd86850` | Ausente | CRM protegido (idêntico ao principal por hash) |
