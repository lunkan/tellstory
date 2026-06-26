import { Typewriter } from "./Typewriter";
import { useSceneStore } from "../../store/sceneStore";
import { DIRECTION_NAME } from "../../../shared/src/direction";
import { DescriptionFeedText } from "./DescriptionFeedText";

export function DescriptionFeed() {
    const description = useSceneStore((state) => state.description);
    const focusMode = useSceneStore((state) => state.focusMode);
    const attentionDirection = useSceneStore((state) => state.attentionDirection);
    const moveDirection = useSceneStore((state) => state.moveDirection);
    const alertMessage = useSceneStore((state) => state.alertMessage);
    const ready = useSceneStore((state) => state.ready);

    function handleAnimationComplete(id: string): void {
        useSceneStore.getState().consumeDescription(id);
    }

    if (alertMessage) {
        return (
            <DescriptionFeedText label="">
                <div>{alertMessage}</div>
            </DescriptionFeedText>
        );
    } else if (!ready && moveDirection) {
        return (<DescriptionFeedText label={`Moving ${DIRECTION_NAME[moveDirection]}`}></DescriptionFeedText>);
    } else if (!description && focusMode) {
        return (<DescriptionFeedText></DescriptionFeedText>);
    } else if (!description) {
        return (<DescriptionFeedText label="What do you want to do?"></DescriptionFeedText>);
    }

    const label = [
        description!.label,
        attentionDirection && attentionDirection.impassible ? ' (Impassible)' : ''
    ].join();

    return (
        <DescriptionFeedText label={label}>
            <Typewriter id={description!.id} text={description!.text} onAnimationComplete={handleAnimationComplete}></Typewriter>
        </DescriptionFeedText>
    );
}

/*

*/
