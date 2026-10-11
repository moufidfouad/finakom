import { OrgNode } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

function OrgNodeCard({ node, depth }: { node: OrgNode; depth: number }) {
  return (
    <div
      style={{ marginLeft: depth > 0 ? 24 : 0 }}
      className={depth > 0 ? "mt-2 border-l border-border pl-4" : "mt-2"}
    >
      <Card>
        <CardContent className="p-3">
          <p className="text-sm font-medium">{node.fullName}</p>
          <p className="text-xs text-muted-foreground">{node.position}</p>
        </CardContent>
      </Card>
      {node.directReports.map((child) => (
        <OrgNodeCard key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function OrgChartView({ tree }: { tree: OrgNode[] }) {
  if (tree.length === 0) {
    return (
      <EmptyState
        message="Aucun employé actif à afficher dans l'organigramme."
        variant="compact"
      />
    );
  }
  return (
    <div>
      {tree.map((root) => (
        <OrgNodeCard key={root.id} node={root} depth={0} />
      ))}
    </div>
  );
}
