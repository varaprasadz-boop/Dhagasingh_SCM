import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary";
}

export function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  variant = "outline",
}: QuickActionButtonProps) {
  return (
    <Button
      variant={variant}
      className="h-auto flex-col gap-2 py-4 px-6"
      onClick={onClick}
      data-testid={`button-quick-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className="h-6 w-6" />
      <div className="text-center">
        <p className="font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground font-normal">{description}</p>
        )}
      </div>
    </Button>
  );
}
