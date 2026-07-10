# Domain Value Chain

> **Source:** [Domain Model §1](../architecture/01-domain-model.md#1-complete-domain-model)

The PondDesk domain is organized around one primary value chain: convert fingerlings into harvestable biomass through controlled pond operations.

## Value Chain Diagram

```mermaid
flowchart LR
    subgraph Inputs
        V[Vendor / Hatchery]
        F[Feed Inventory]
        W[Water Quality]
    end

    subgraph Production
        P[Pond]
        B[Fish Batch]
        FD[Feeding]
        M[Mortality]
        WT[Water Record]
    end

    subgraph Outputs
        H[Harvest]
        C[Customer / Sale]
        R[Reports]
    end

    V -->|fingerlings| B
    F -->|feed| FD
    B --> P
    FD --> B
    M --> B
    WT --> P
    B --> H
    H --> C
    B --> R
    H --> R
    FD --> R
```

## Bounded Contexts

```mermaid
flowchart TB
    subgraph Identity["Identity & Access"]
        U[User]
        RO[Role]
        FM[Farm Membership]
    end

    subgraph FarmOps["Farm Operations"]
        FA[Farm]
        PO[Pond]
        FB[Fish Batch]
    end

    subgraph Daily["Daily Operations"]
        FE[Feeding]
        WR[Water Record]
    end

    subgraph Supply["Supply Chain"]
        FI[Feed Inventory]
        VE[Vendor]
    end

    subgraph Revenue["Harvest & Sales"]
        HV[Harvest]
        CU[Customer]
    end

    subgraph Platform["Platform"]
        NO[Notification]
        RP[Report]
        SE[Settings]
    end

    FA --> PO --> FB
    FB --> FE
    PO --> WR
    VE --> FI --> FE
    FB --> HV --> CU
    FA --> RP
    FA --> NO
    U --> FM --> FA
```

## Related Documents

- [Domain Model](../architecture/01-domain-model.md)
- [Business Workflows](../architecture/01-domain-model.md#4-business-workflows)
- [Fish Batch Lifecycle](./batch-lifecycle.md)
- [Database ERD](./database-erd.md)
