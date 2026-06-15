/** Pure archive row filtering — shared by backend list + frontend tests */

export function filterArchiveRows(rows, filters = {}) {
  let list = Array.isArray(rows) ? [...rows] : [];
  const { salespersonId, startDate, endDate } = filters;

  if (salespersonId != null && salespersonId !== "") {
    list = list.filter((r) => String(r.salespersonId) === String(salespersonId));
  }

  if (startDate) {
    const start = new Date(startDate).getTime();
    if (Number.isFinite(start)) {
      list = list.filter((r) => new Date(r.date).getTime() >= start);
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (Number.isFinite(end.getTime())) {
      list = list.filter((r) => new Date(r.date).getTime() <= end.getTime());
    }
  }

  return list.sort((a, b) => new Date(b.date) - new Date(a.date));
}
