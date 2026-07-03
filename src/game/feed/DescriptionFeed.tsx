import { Typewriter } from "./Typewriter";
import { AlertMessage, DirectionDescription, SceneDescription, selectSceneReady, selectAlertMessage, selectDirectionDescription, selectPrimaryDescription, selectSecondaryDescription, useSceneStore } from "../../store/sceneStore";
import { getDepthName } from "../../../shared/src/phraseology";
import { DescriptionFeedText } from "./DescriptionFeedText";
import { useRef } from "react";

export function DescriptionFeed() {
    const title = useSceneStore((state) => state.title);
    const attention = useSceneStore((state) => state.attention);
    const sceneReady = useSceneStore(selectSceneReady);
    const primaryDescription = useSceneStore(selectPrimaryDescription);
    const secondaryDescription = useSceneStore(selectSecondaryDescription);
    const alertMessage = useSceneStore(selectAlertMessage);
    const directionDescription = useSceneStore(selectDirectionDescription);
    const currentDescriptionRef = useRef<string | undefined>();

    function handleAnimationComplete(id: string): void {
        currentDescriptionRef.current = undefined;
        useSceneStore.getState().consumeDescription(id);
    }

    function renderDescription(description: SceneDescription | DirectionDescription | AlertMessage) {
        currentDescriptionRef.current = description!.id;

        return (
            <DescriptionFeedText label={description.label}>
                <Typewriter id={description.id} text={description!.text} onAnimationComplete={handleAnimationComplete}></Typewriter>
            </DescriptionFeedText>
        );
    }

    if (!sceneReady) {
        // No messages  arrived yet
        return (<DescriptionFeedText label={title}></DescriptionFeedText>);
    }

    if (alertMessage) {
        return renderDescription(alertMessage);
    }

    if (attention?.type === 'zoom') {
        return (<DescriptionFeedText label={`Overview ${getDepthName(attention.value || 0)}`}></DescriptionFeedText>);
    }

    if (attention?.type === 'direction') {
        if (directionDescription) {
            return renderDescription(directionDescription);
        }

        // Focus mode without direction or pending description...
        return (<DescriptionFeedText></DescriptionFeedText>);
    }

    if (primaryDescription) {
        return renderDescription(primaryDescription);
    }

    if (secondaryDescription) {
        return renderDescription(secondaryDescription);
    }

    // Idle
    return (<DescriptionFeedText label="What do you want to do?"></DescriptionFeedText>);
}
