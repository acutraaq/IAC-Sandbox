import { TemplateGrid } from "@/components/home/TemplateGrid";
import { DeployedList } from "@/components/home/DeployedList";

export default function Home() {
  return (
    <div className="mx-auto max-w-7xl">
      <TemplateGrid />
      <DeployedList />
    </div>
  );
}
