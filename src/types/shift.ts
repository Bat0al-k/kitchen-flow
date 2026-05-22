export type Shift = {
    _id?: string;
    type: "MORNING" | "EVENING";
    status: "ACTIVE" | "ENDED";
    startedAt: string;
    endedAt?: string;
    startedBy: string;
    endedBy?: string;
    
    // Compatibility fields
    isActive?: boolean;
    shiftName?: string;
};

