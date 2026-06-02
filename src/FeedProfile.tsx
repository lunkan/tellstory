import { LocationProfile } from "../storyteller/types";

type FeedProfileProps = {
    title: string;
    profile: LocationProfile | null;
}

export function FeedProfile({ title, profile }: FeedProfileProps) {
    if (!profile) {
        return (<div>No location profile</div>);
    }

    return (
        <>
            <h4>{title}</h4>
            <div>
                <p>{profile.description}</p>
            </div>
        </>
    );
}