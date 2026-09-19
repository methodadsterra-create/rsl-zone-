// Minimal reusable table for admin list pages. Columns: [{ key, label, render? }]
export default function AdminTable({ columns, rows, emptyMessage = 'Nothing here yet.' }) {
  if (!rows || rows.length === 0) {
    return <p>{emptyMessage}</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
