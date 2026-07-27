export function formatUnit(unit: { block: string; lot: string } | null | undefined) {
    if (!unit) return "—";
    return `Blk ${unit.block} Lot ${unit.lot}`
}