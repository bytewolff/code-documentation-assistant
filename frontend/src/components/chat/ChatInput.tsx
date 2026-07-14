import { useState, type KeyboardEvent } from "react";
import { SendIcon } from "lucide-react";
import {
    InputGroup,
    InputGroupTextarea,
    InputGroupAddon,
    InputGroupButton,
} from "@/components/ui/input-group";

export function ChatInput({
    onSubmit,
    disabled,
}: {
    onSubmit: (question: string) => void;
    disabled?: boolean;
}) {
    const [value, setValue] = useState("");

    const handleSubmit = () => {
        const question = value.trim();
        if (!question || disabled) return;
        onSubmit(question);
        setValue("");
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    };

    return (
        <InputGroup className="h-auto p-1">
            <InputGroupTextarea
                placeholder="Ask a question about the code…"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                rows={2}
            />
            <InputGroupAddon align="inline-end">
                <InputGroupButton
                    data-icon="inline-end"
                    size="icon-sm"
                    onClick={handleSubmit}
                    disabled={disabled || value.trim().length === 0}
                    aria-label="Send message"
                >
                    <SendIcon />
                </InputGroupButton>
            </InputGroupAddon>
        </InputGroup>
    );
}
