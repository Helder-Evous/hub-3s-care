# Manifesto de migrations — Principal

- **Ambiente:** Principal
- **Project ID:** `nndvcsdevbxpgsccyimm`
- **Total de migrations registradas:** 23
- **Fonte:** `supabase_migrations.schema_migrations` (consulta read-only, 2026-06-25)
- **SHA-256:** calculado sobre o conteúdo bruto de `statements` — itens do array unidos por LF (U+000A), na ordem original, sem newline final. Idêntico ao hash computado no banco via `encode(digest(array_to_string(statements, E'\n'),'sha256'),'hex')`.
- **Rollback:** nenhuma migration registrada possui conteúdo em `rollback` (todas vazias).

| Version | Name | Statements | Rollback | SHA-256 | Equivalente no GitHub | Classificação |
| ------- | ---- | ---------: | -------: | ------- | --------------------- | ------------- |
| `20260529143328` | `0c3bac65-0b3f-43bd-86c2-e0897b9d7924` | 33 | 0 | `661788c4599f9ba39401c195d7786bda0cbfe57df605498c2e7d9a4465a06980` | `20260529143328` (mesma versão) | mesma versão no GitHub |
| `20260604133039` | `e7560ffe-f3fe-4190-9f11-2f38c1563aea` | 1 | 0 | `3d4a5567dfcf771beda238b32b7980d9d0bf585e7bb6c60b9235bc15f40a2329` | `20260604133039` (mesma versão) | mesma versão no GitHub |
| `20260604135414` | `add_hub_users` | 1 | 0 | `9b4a0d1aee6f6d2ff8f2ada97308fc130d19b3bf11dd3c52d5f841d6a90ce22d` | `20260604000001_add_hub_users` | versão diferente, alteração equivalente |
| `20260604135435` | `extend_existing_tables` | 1 | 0 | `b9b9e73fefb942ef847215ed3b6b9a8ca667b5863822abfb10d73e0b9644ee79` | `20260604000002_extend_existing_tables` | versão diferente, alteração equivalente |
| `20260604135449` | `add_templates_and_volume` | 1 | 0 | `73824374f141b454dda43080072da929f47386d45b7415fe04e0516ad6ffac9f` | `20260604000003_add_templates_and_volume` | versão diferente, alteração equivalente |
| `20260604135500` | `add_indexes` | 1 | 0 | `8f0429176f1159c5145a3164ea1974f57a8121a3edc43e22527a0b0164ea477e` | `20260604000004_add_indexes` | versão diferente, alteração equivalente |
| `20260604135513` | `add_clinic_scores_view` | 1 | 0 | `3a032f94bb7055003541e44763ad938a5760c1b9353a55e3c32e34b16d1924eb` | `20260604000005_add_clinic_scores_view` | versão diferente, alteração equivalente |
| `20260604171237` | `fase1_base_estrutural` | 1 | 0 | `b6c13c30e7403de7cccef4d11d1b01920046a79d8f99ccf0e8f1176ff9501104` | `20260604200001_fase1_base_estrutural` | versão diferente, alteração equivalente |
| `20260604184531` | `fix_rls_recursive_hub_users` | 1 | 0 | `186a7fd0563a24b3d12cecade7b144db41f3e29958d5e1824e27acbdd6f0a2e4` | Ausente | ausente no GitHub |
| `20260605143042` | `create_system_events` | 1 | 0 | `52177bb144d04d138dc3fe52e24b247c1482d59544376904529f296aaa785f6a` | Ausente | ausente no GitHub |
| `20260619204324` | `create_ai_tasks` | 1 | 0 | `4ccb7d0cc0bbd45061a0301a43a42e05d197da6b54de6f510c13c119bddc5116` | `20260619000001_create_ai_tasks` | versão diferente, alteração equivalente |
| `20260619204335` | `evolve_ai_tasks_priority` | 1 | 0 | `c7f2c587a58f8fdbd4c44d91f9306e31cc05218524982e242476b27fb65fd6f0` | `20260619000002_evolve_ai_tasks_priority` | versão diferente, alteração equivalente |
| `20260623153559` | `crm_001_schema_and_grants` | 1 | 0 | `13415113f8f659c71bd9891c65b30b0c8f1e99aba3b387e0350198ac3bfdb635` | Ausente | CRM protegido (idêntico ao DEV por hash) |
| `20260623153628` | `crm_002_enums_and_lead_sources` | 1 | 0 | `e9a1985d12024de77eff0aab32964e0586e8415ef723d2b2b0675b1ac0819479` | Ausente | CRM protegido (idêntico ao DEV por hash) |
| `20260623153647` | `crm_003_access_model` | 1 | 0 | `677879b78d8ce8227c9d594b0412ccc223f0077722667351e5715688752f7b90` | Ausente | CRM protegido (idêntico ao DEV por hash) |
| `20260623153710` | `crm_004_helpers_and_rls` | 1 | 0 | `e762158ac64eb4e32dd87e2ee2bdd164cbd757d53aefc3f17617b394af5f9589` | Ausente | CRM protegido; divergência histórica textual (vs DEV) |
| `20260623153731` | `crm_005_patients` | 1 | 0 | `01db3c052c84bece88b349c92ff2147bdb44558b1322788ed5808246792daf9c` | Ausente | CRM protegido; divergência histórica textual (vs DEV) |
| `20260623153751` | `crm_006_leads` | 1 | 0 | `f3a553a5632ad3ee18cd87325af1bcdedb8a9880e57f6948c1f03f3ade321516` | Ausente | CRM protegido; divergência histórica textual (vs DEV) |
| `20260623153809` | `crm_007_lead_activities` | 1 | 0 | `5192b19d28319c8729a024d64ecb365c830a1ff3fdb37b465d67e65db665d228` | Ausente | CRM protegido; divergência histórica textual (vs DEV) |
| `20260623153826` | `crm_008_appointments` | 1 | 0 | `66a52de7c3f2acc2dcde06c2fb11f4034fb5065e202378ae510a4ca7e5d11336` | Ausente | CRM protegido; divergência histórica textual (vs DEV) |
| `20260623153846` | `crm_009_budgets` | 1 | 0 | `67485f2e569d67aa13673102ecbbfe1af2aa8d5ecdf7ae988beac0d2c20c4e32` | Ausente | CRM protegido; divergência histórica textual (vs DEV) |
| `20260623153913` | `crm_010_stage_derivation` | 1 | 0 | `0a63fb40bff7c47338bc1ff97a1e3ebce6870db054af69d566b79d941686fe7b` | Ausente | CRM protegido; divergência histórica textual (vs DEV) |
| `20260623201809` | `crm_011_api_grants` | 1 | 0 | `ab49e281e835ac41573faabe603fbfd398944a830954dfdb610ba0e63cd86850` | Ausente | CRM protegido (idêntico ao DEV por hash) |
