import { Typewriter } from "./Typewriter";
import { AlertMessage, DirectionDescription, SceneDescription, selectSceneReady, selectAlertMessage, selectDirectionDescription, selectPrimaryDescription, selectSecondaryDescription, useSceneStore } from "../../store/sceneStore";
import { getDepthName } from "../../../shared/src/phraseology";
import { DescriptionFeedText } from "./DescriptionFeedText";
import { useRef } from "react";
import { audioManager } from "../../audio/AudioManager";

type CurrentDescriptionRef = {
    id: string;
    textCompleted: boolean;
    narratorCompleted: boolean;
}

export function DescriptionFeed() {
    const title = useSceneStore((state) => state.title);
    const attention = useSceneStore((state) => state.attention);
    const sceneReady = useSceneStore(selectSceneReady);
    const primaryDescription = useSceneStore(selectPrimaryDescription);
    const secondaryDescription = useSceneStore(selectSecondaryDescription);
    const alertMessage = useSceneStore(selectAlertMessage);
    const directionDescription = useSceneStore(selectDirectionDescription);
    const currentDescriptionRef = useRef<CurrentDescriptionRef | undefined>();

    function handleTextAnimationComplete(id: string): void {
        if (!currentDescriptionRef.current || currentDescriptionRef.current.id !== id) {
            return;
        }

        currentDescriptionRef.current.textCompleted = true;
        if (currentDescriptionRef.current.textCompleted && currentDescriptionRef.current.narratorCompleted) {
            useSceneStore.getState().consumeDescription(id);
        }
    }

    function handleNarratorSpeakComplete(id: string): void {
        if (!currentDescriptionRef.current || currentDescriptionRef.current.id !== id) {
            return;
        }

        currentDescriptionRef.current.narratorCompleted = true;
        if (currentDescriptionRef.current.textCompleted && currentDescriptionRef.current.narratorCompleted) {
            useSceneStore.getState().consumeDescription(id);
        }
    }

    function updateState(description: SceneDescription | DirectionDescription | AlertMessage): void {
        if (currentDescriptionRef.current && currentDescriptionRef.current.id === description.id) {
            return;
        }

        if (currentDescriptionRef.current) {
            audioManager.stop();
        }

        currentDescriptionRef.current = {
            id: description.id,
            textCompleted: false,
            narratorCompleted: false,
        };

        audioManager.play(description.text).then(() => handleNarratorSpeakComplete(description.id));
    }

    function renderDescription(description: SceneDescription | DirectionDescription | AlertMessage) {
        updateState(description);

        return (
            <DescriptionFeedText label={description.label}>
                <Typewriter id={description.id} text={description!.text} onAnimationComplete={handleTextAnimationComplete}></Typewriter>
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
