---
name: world-relationship-declarations
definition: >
  Owns the declared relationships between the platform and each world this
  estate acts in. One declaration per world states, once: the label naming
  the relationship; the credential requirement — the shape of the material
  the world demands, each element carrying its meaning, whether it is
  required and whether it is confidential; the initialization — the judgment
  that supplied material conforms and is sound, followed by construction of
  the world-context every realization in that world acts through; and the
  capabilities — the named abilities the world affords through the
  initialized relationship, each described by its author and each carrying
  its own validation that judged material actually affords it. It exists
  because everything true of a world rather than of an entity realized in it
  has exactly one owner; without it a world label is a bare string agreed by
  convention, material is judged nowhere or everywhere, every realization
  restates the same context construction, and what a world affords is
  discovered only when an act against it fails. A world demanding no
  material and a world declaring no capability are both valid declarations.
  Capability identity is declaration-scoped; no capability vocabulary exists
  outside the declarations.
inputs:
  - name: provider-authoring-intent
    counterpart: environment
    description: >
      The worlds this estate's authors can reach, the labels naming them,
      the material each demands, how its soundness is judged, how a context
      for acting in each world is built, and the named abilities each world
      affords with the judgment that material affords them. Flows inward
      because a declaration supplies shape and no knowledge: a label and its
      capabilities exist because an author wrote them.
  - name: world-material-selection
    description: >
      The reviewed selection of which world serves each governed
      relationship and the credential material supplied for it. Flows inward
      because selection and supply are the environment's genuine choices,
      while judging the material and constructing authority from it are
      this subsystem's alone.
outputs:
  - name: aws-control-authority
    description: >
      Judged authority over the selected AWS account and region: the
      world-context constructed by initialization of admitted material,
      answered per demanded capability, supplied only to infrastructure
      whose declared realization demands it.
  - name: gcloud-control-authority
    description: >
      Judged authority over the selected Google Cloud project and region,
      constructed by initialization and answered per demanded capability,
      supplied only to infrastructure whose declared realization demands it.
  - name: atlas-control-authority
    description: >
      Judged authority over the selected document-database organization or
      project, constructed by initialization and answered per demanded
      capability, supplied only to the governed document store.
  - name: edge-control-authority
    description: >
      Judged authority over the selected domain zone and its public edge
      account, constructed by initialization and answered per demanded
      capability, supplied to public-name and edge-delivery infrastructure.
  - name: world-capability-account
    counterpart: environment
    description: >
      The executable-free account of each declared relationship: its label,
      its credential requirement with per-element meaning, optionality and
      confidentiality, and its declared capabilities, each with its stated
      meaning. Flows outward to the platform that elicits material, judges
      bindings and matches capability demands without executing any
      declaration's interior.
---
