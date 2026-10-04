import { EditState, useEditorStore } from "../../store/editorStore";
import { SidebarDraw } from "./draw/SidebarDraw";
import { SidebarSelect } from "./select/SidebarSelect";

type SidebarContentProps = {
    editState: EditState;
}

function SidebarContent({ editState }: SidebarContentProps) {
    switch (editState) {
        case 'select':
            return <SidebarSelect />;
        case 'draw':
            return <SidebarDraw />;
        default:
            return <div>Unknown state</div>;
    }
}

export function Sidebar() {
    const editState = useEditorStore((state) => state.editState);

    return (
        <SidebarContent editState={editState} />
    );
}