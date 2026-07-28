export function formatUnit(unit: { block: string; lot: string } | null | undefined) {
    if (!unit) return "—";
    return `Blk ${unit.block} Lot ${unit.lot}`
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}