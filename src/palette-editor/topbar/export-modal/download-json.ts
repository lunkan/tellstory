/**
 * Exports any JavaScript object or array as a downloadable JSON file.
 * 
 * @param data - The object, array, or primitive to export.
 * @param fileName - The desired name of the downloaded file (defaults to 'data.json').
 */
export function downloadJsonFile<T,>(data: T, fileName: string = 'data.json'): void {
    try {
        // 1. Convert data to a formatted JSON string
        const jsonString: string = JSON.stringify(data, null, 2);

        // 2. Create a Blob specifying the JSON type
        const blob: Blob = new Blob([jsonString], { type: 'application/json' });

        // 3. Generate a temporary Object URL
        const url: string = URL.createObjectURL(blob);

        // 4. Create the anchor element programmatically
        const link: HTMLAnchorElement = document.createElement('a');
        link.href = url;
        link.download = fileName;

        // 5. Append, click to trigger download, and remove from DOM
        document.body.appendChild(link);
        link.click();

        // 6. Clean up memory and DOM footprint
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to export JSON file:', error);
    }
};