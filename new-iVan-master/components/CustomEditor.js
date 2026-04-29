'use client'
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

function CustomEditor(props) {
    const {
        description,
        isUpdating,
        clearEditorState, handleDescriptionChange, placeholder
    } = props;
    const [editorContent, setEditorContent] = useState("");
    const quillRef = useRef(null);

    useEffect(() => {
        if (isUpdating && description) {
            setEditorContent(description);
        }
        if (clearEditorState) {
            setEditorContent("")
        }
    }, [isUpdating, description, clearEditorState]);

    const handleEditorChange = (content) => {
        setEditorContent(content);
        if (handleDescriptionChange) {
            handleDescriptionChange(content);
        }
    };

    const handlePastedText = (pastedText) => {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);

        if (range) { // Check if range exists
            quill.insertText(range.index, pastedText, { link: pastedText });
        }
        return;
    }

    useEffect(() => {
        const quillEditor = quillRef.current.getEditor().root;

        const handlePaste = (event) => {
            const pastedText = event.clipboardData.getData('text');

            // Check for a URL in pasted text
            const urlPattern = /^(https?:\/\/[^\s]+)/g;
            if (urlPattern.test(pastedText)) {
                event.preventDefault();
                handlePastedText(pastedText)
            }


        };

        return () => {
            quillEditor.removeEventListener("paste", handlePaste);
        };
    }, []);
    const modules = useMemo(
        () => ({
            toolbar: [
                [{ header: "1" }, { header: "2" }, { font: [] }],
                [{ list: "ordered" }, { list: "bullet" }],
                ["bold", "italic", "underline", "strike", "blockquote"],
                [{ align: [] }],
                ["link"],
                ["clean"],
            ],
            clipboard: {
                matchers: [
                    ['A', (node, delta) => {
                        delta.ops.forEach(op => {
                            if (op.attributes && op.attributes.link) {
                                op.attributes.target = '_blank'; // Ensure links open in new tab
                            }
                        });
                        return delta;
                    }]
                ]
            },
        }),

        []
    );

    const formats = [
        "header",
        "font",
        "bold",
        "italic",
        "underline",
        "strike",
        "blockquote",
        "list",
        "bullet",
        "align",
        "link",
    ];

    return (
        <div className="custom-editor">
            <ReactQuill
                ref={quillRef}
                value={editorContent}
                onChange={handleEditorChange}
                placeholder={placeholder}
                modules={modules}
                formats={formats}
                className="text-black"
            />
        </div>
    );
}

export default CustomEditor;
