# Default development (runs minimal profile - 6 pods instead of 15)

`skaffold dev`

# Explicitly run minimal

`skaffold dev -p minimal`

# Backend services only (no frontend, no ELK)

`skaffold dev -p backend`

# MFE development

`skaffold dev -p mfe`

# Full stack (when you really need everything)

skaffold dev -p full
