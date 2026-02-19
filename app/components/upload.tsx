import { CheckCircle2, ImageIcon, UploadIcon } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext } from 'react-router'
import {
    PROGRESS_INCREMENT,
    REDIRECT_DELAY_MS,
    PROGRESS_INTERVAL_MS,
} from '../../lib/constants'

interface UploadProps {
    onComplete?: (base64: string) => void
}

const Upload: React.FC<UploadProps> = ({ onComplete }) => {
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [progress, setProgress] = useState(0)

    const { isSignedIn } = useOutletContext<AuthContext>()

    const inputRef = useRef<HTMLInputElement | null>(null)
    const intervalRef = useRef<number | null>(null)

    const clearProgressInterval = useCallback(() => {
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current)
            intervalRef.current = null
        }
    }, [])

    useEffect(() => {
        return () => {
            clearProgressInterval()
        }
    }, [clearProgressInterval])

    const processFile = useCallback((fileToProcess: File) => {
        if (!isSignedIn) {
            return
        }

        const reader = new FileReader()
        setFile(fileToProcess)
        setProgress(0)

        reader.onload = (e) => {
            const result = e.target?.result
            const base64 = typeof result === 'string' ? result : ''

            // reset and start progress
            clearProgressInterval()

            intervalRef.current = window.setInterval(() => {
                setProgress((prev) => {
                    const next = Math.min(100, prev + PROGRESS_INCREMENT)
                    if (next >= 100) {
                        clearProgressInterval()
                        setProgress(100)
                        // call onComplete after redirect delay
                        setTimeout(() => {
                            onComplete?.(base64)
                        }, REDIRECT_DELAY_MS)
                    }
                    return next
                })
            }, PROGRESS_INTERVAL_MS)
        }

        reader.onerror = () => {
            // handle read error by clearing interval and resetting
            clearProgressInterval()
            setProgress(0)
        }

        reader.readAsDataURL(fileToProcess)
    }, [clearProgressInterval, isSignedIn, onComplete])

    const handleFiles = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) {
            return
        }
        if (!isSignedIn) {
            return
        }

        const next = files[0]
        setFile(next)
        processFile(next)
    }, [isSignedIn, processFile])

    const onDragEnter: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault()
        e.stopPropagation()
        // keep the dragging visual
        setIsDragging(true)
    }

    const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const dtFiles = e.dataTransfer?.files ?? null
        // Block processing if not signed in
        if (!isSignedIn) {
            return
        }

        handleFiles(dtFiles)
    }

    const onInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        handleFiles(e.target.files)
    }

    const onClickDropzone = () => {
        if (!isSignedIn) {
            return
        }
        inputRef.current?.click()
    }

    return (
        <div className='upload'>
            {
                !file ? (
                    <div
                        className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                        onDragEnter={onDragEnter}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={onClickDropzone}
                        role="button"
                        tabIndex={0}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            className='drop-input'
                            accept='.jpg,.jpeg,.png'
                            disabled={!isSignedIn}
                            onChange={onInputChange}
                        />

                        <div className="drop-content">
                            <div className="drop-icon">
                                <UploadIcon size={20} />
                            </div>
                            <p>
                                {
                                    isSignedIn ? (
                                        "Click to upload file or just drag and drop"
                                    ) : (
                                        "Sign in or sign up with Puter to upload"
                                    )
                                }
                            </p>
                            <p className='help'>
                                Maximum file size is 50MB.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="upload-status">
                        <div className="status-content">
                            <div className="status-icon">
                                {
                                    progress === 100 ? (
                                        <CheckCircle2 className='check' />
                                    ) : (
                                        <ImageIcon className='image' />
                                    )
                                }
                            </div>
                            <h3>
                                {file.name}
                            </h3>
                            <div className="progress">
                                <div className="bar" style={{width: `${progress}%`}} />
                                <p className="status-tetx">
                                    {progress < 100 ? "Analyzing Floor Plan..." : "Redirecting..."}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    )
}

export default Upload