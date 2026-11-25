---
name: github-organization
definition: >
  The organization-integration member realizing an organization's
  standing in the code-host world: the composition's proof that an
  organization's declared world extends beyond infrastructure to the
  worlds its members work in. Provisioning stewards a pre-existing
  external organization — the world does not afford creating one, so
  this member never claims to: it takes the configured organization
  coordinate, brings that organization's declared settings under
  engine management, and records the organization's external identity;
  what it manages is the declared shape of an organization that already
  exists, never the organization's existence. Member allocation's
  desired-state resource is the external membership itself: declaring a
  member's allocation extends the world's own invitation to the named
  external principal under one of the world's own membership grades;
  an invitation awaiting the principal's acceptance is observed state
  of that one resource, not a lifecycle act, so no acceptance is polled
  for and no callback exists; acceptance converges the same resource to
  membership, and a member leaving the effective allocation set has the
  invitation withdrawn or the membership removed by ordinary
  reconciliation of the shrunk declared set. Exactly two lifecycles are
  authored — provision and member allocation — and no removal,
  retention or cleanup authoring exists, those being the convergence
  boundary's law, not this member's. Both lifecycles yield one declared
  output shape recording external identities only: the organization's
  external identity and its settings-stewardship identity always, and
  the allocated principal's external identity with its membership
  identity when a member is allocated; retained state carries exactly
  what allocation needs — the organization's external identity and
  settings-stewardship identity. Credential material appears in no
  configuration, no output, no state and no refusal. The member carries
  one realization, bound by reference to this composition's github
  declaration and demanding by name exactly the two capabilities its
  lifecycles exercise — organization-settings for provisioning,
  organization-membership-invitations for allocation — acting in the
  world only through the world-context that declaration constructs.
inputs:
  - name: organization-presence-intent
    boundary: environment/deployment
    description: >
      The judged configuration of one component entry naming this
      member: the external organization coordinate to steward and the
      declared settings it is to hold, supplied by the enacting platform
      boundary from an admitted organization stack configuration. Flows
      inward because what shape the organization's world should have is
      the customer's declaration, judged elsewhere; this member only
      realizes it.
  - name: member-allocation-intent
    boundary: environment/deployment
    description: >
      The effective allocation configuration for each current member to
      be realized in this world: the member's external principal
      coordinate and the membership grade, drawn from the world's own
      grades, derived by the enacting platform from declared roles and
      overrides. Flows inward because who is allocated and under what
      configuration is declared meaning the platform derives; this
      member realizes exactly the delivered set and nothing it infers.
  - name: github-world-relationship
    description: >
      The initialized, capability-validated relationship with the
      code-host world, constructed by this composition's github
      declaration. Flows inward because every act this member performs
      in the world goes through that context and through the two
      capabilities it demands by name — the member holds no world
      authority of its own.
outputs:
  - name: external-organization-standing
    boundary: environment/deployment
    description: >
      The recorded external identities and observed standing this
      member's reconciliation yields: the stewarded organization's
      external identity and settings-stewardship identity, and per
      allocated member the external principal identity, the membership
      identity, and whether the world observes the principal as invited
      or as member. Flows outward because the enacting platform records
      convergence standing faithfully and renders it on readback, and
      pending acceptance is world-originated fact the platform must
      show, never a failure of allocation.
---
