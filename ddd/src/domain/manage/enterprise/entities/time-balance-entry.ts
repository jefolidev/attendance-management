import { Entity } from "../../../../core/entities/entity";
import type { Optional } from "../../../../core/entities/types/optional";
import type { UniqueEntityId } from "../../../../core/entities/unique-entity-id";

export type WorkBalanceEntryType = "CREDIT" | "DEBIT";

export type WorkBalanceEntryReason =
  | "LATE_ARRIVAL"
  | "EARLY_DEPARTURE"
  | "OVERTIME"
  | "COMPENSATION"
  | "MANUAL_ADJUSTMENT";

interface WorkBalanceEntryProps {
  employeeId: UniqueEntityId;
  type: WorkBalanceEntryType;
  reason: WorkBalanceEntryReason;

  durationInMinutes: number;

  createdAt: Date;
}

export class WorkBalanceEntry extends Entity<WorkBalanceEntryProps> {
  get employeeId(): UniqueEntityId {
    return this.props.employeeId;
  }

  get type(): WorkBalanceEntryType {
    return this.props.type;
  }

  get reason(): WorkBalanceEntryReason {
    return this.props.reason;
  }

  get durationInMinutes(): number {
    return this.props.durationInMinutes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get signedDurationInMinutes(): number {
    return this.props.type === "CREDIT"
      ? this.props.durationInMinutes
      : -this.props.durationInMinutes;
  }

  static create(
    props: Optional<WorkBalanceEntryProps, "createdAt">,
    id?: UniqueEntityId,
  ): WorkBalanceEntry {
    return new WorkBalanceEntry(
      {
        ...props,
        createdAt: new Date(),
      },
      id,
    );
  }
}