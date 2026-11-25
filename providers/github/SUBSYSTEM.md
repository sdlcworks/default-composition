---
name: github
definition: >
  This composition's sole declaration of the github world: the one
  declared relationship between the platform and the code-host provider
  world, standing independently of every entity realized in it. The
  label names the relationship and nothing else; the software that backs
  it is this declaration's private choice. It declares, once: its
  credential requirement — one confidential token whose grant must carry
  organization-administration authority over the world, and one optional,
  non-confidential alternate world address for enterprise-hosted worlds,
  normalized once so that judgment and later action address the same
  world; its initialization — the judgment that supplied material
  conforms to the requirement and is sound, rendered by authenticating
  against the addressed world and observing the authority the world
  itself attests for the token, never by inspecting the material's form
  alone, followed by construction of the typed world-context realizations
  act through, carrying the judged material, the normalized world address
  and the observed authority; and exactly two author-named capabilities,
  each validated independently against the initialized relationship —
  organization-settings, the world's affordance of stewarding a
  pre-existing organization's declared settings, and
  organization-membership-invitations, the world's affordance of
  extending membership invitations to principals, observing their
  standing, and withdrawing them. Each capability validation answers
  satisfied, refused with a named reason, or unable to answer, and a
  refusal never echoes credential material. The declaration judges its
  own material and no other party restates the judgment; no capability
  vocabulary exists here beyond these two names, and that this world
  affords organization, member and role concepts is said entirely by
  them.
inputs:
  - name: world-credential-material
    boundary: environment/deployment
    description: >
      The admitted credential material of one organization's binding to
      this world — the confidential token and optional alternate world
      address — supplied by the enacting platform boundary for exactly
      one initialization or adjudication act and retained no longer.
      Flows inward because material custody and the decision to disclose
      live with the platform, while judging soundness is solely this
      declaration's.
outputs:
  - name: github-world-relationship
    description: >
      The initialized, capability-validated relationship: the typed
      world-context this declaration constructs, and the by-name
      satisfaction of demanded capabilities. Flows outward because
      realizations in this composition bind to this declaration by
      reference, demand organization-settings and
      organization-membership-invitations by name, and act in the world
      only through the context it constructs — never through ambient
      authority of their own.
---
