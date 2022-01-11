import React from "react"
import domElements from "./domElements"
import { classnames } from "tailwindcss-classnames"

export const mergeArrays = (template: TemplateStringsArray, templateElements: (string | undefined | null)[]) => {
    return template.reduce(
        (acc, c, i) => acc.concat(c || [], templateElements[i] || []), //  x || [] to remove false values e.g '', null, undefined. as Array.concat() ignores empty arrays i.e []
        [] as (string | undefined | null)[]
    )
}

export const cleanTemplate = (template: (string | undefined | null)[], inheritedClasses: string = "") => {
    const newClasses: string[] = template
        .join(" ")
        .trim()
        .replace(/\n/g, " ") // replace newline with space
        .replace(/\s{2,}/g, " ") // replace line return by space
        .split(" ")
        .filter((c) => c !== ",") // remove comma introduced by template to string

    const inheritedClassesArray: any = inheritedClasses ? inheritedClasses.split(" ") : []

    return classnames(
        ...inheritedClassesArray
            .concat(newClasses) // add new classes
            .filter((c: string) => c !== " ") // remove empty classes
            .filter((v: string, i: number, arr: string[]) => arr.indexOf(v) === i) // remove duplicate
    ) as string // to remove "TAILWIND_STRING" type
}

type TransientProps = Record<`$${string}`, any>

export type TemplateFunction<P, E> = <K extends TransientProps = {}>(
    template: TemplateStringsArray,
    ...templateElements: ((props: P & K) => string | undefined | null)[]
) => React.ForwardRefExoticComponent<React.PropsWithoutRef<P & K> & React.RefAttributes<E>>

interface ClassNameProp {
    className?: string
}

function templateFunction<P extends ClassNameProp, E = any>(Element: React.ComponentType<P>): TemplateFunction<P, E> {
    return <K extends {}>(
        template: TemplateStringsArray,
        ...templateElements: ((props: P & K) => string | undefined | null)[]
    ) => {
        return React.forwardRef<E, P & K>((props, ref) => (
            <Element
                // forward props
                {...(Object.fromEntries(Object.entries(props).filter(([key]) => key.charAt(0) !== "$")) as P)} // filter out props that starts with "$"
                // forward ref
                ref={ref}
                // set class names
                className={cleanTemplate(
                    mergeArrays(
                        template,
                        templateElements.map((t) => t(props))
                    ),
                    props.className
                )}
            />
        ))
    }
}

export type IntrinsicElements = {
    [key in keyof JSX.IntrinsicElements]: TemplateFunction<JSX.IntrinsicElements[key], any>
}

const intrinsicElements: IntrinsicElements = domElements.reduce(
    <K extends keyof JSX.IntrinsicElements>(acc: IntrinsicElements, DomElement: K) => ({
        ...acc,
        [DomElement]: templateFunction((DomElement as unknown) as React.ComponentType<JSX.IntrinsicElements[K]>)
    }),
    {} as IntrinsicElements
)

const tw = Object.assign(templateFunction, intrinsicElements)

export default tw
