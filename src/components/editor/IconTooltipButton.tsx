import { Button } from "#components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "#components/ui/tooltip";

export function IconTooltipButton({ label, children, ...props }: any) {
  return (
    <Button {...props}>
      <Tooltip>
        <TooltipTrigger>{children}</TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    </Button>
  );
}
