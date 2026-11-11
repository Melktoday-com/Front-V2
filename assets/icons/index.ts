import React, { type ComponentProps } from "react";
import exploreIcon from "./explore-icon.svg";
import sendIcon from "./send-icon.svg";
import temporaryRentIcon from "./temporary-rent-icon.png";

export interface ExploreIconProps extends ComponentProps<"svg"> {
    active?: boolean;
}

const EXPLORE_FILLED_PATH =
    "M95.5,25.2c0,0-3.1-14.8-16.5-20c-6.3-2.4-17.8-3.6-29.1-3.7C38.6,1.6,27.1,2.8,20.8,5.2c-13.4,5.2-16.5,20-16.5,20 c-2,8.4-2.7,16.9-2.6,24.4c-0.1,7.5,0.5,16.1,2.6,24.4c0,0,3.1,14.8,16.5,20c6.3,2.4,17.8,3.6,29.1,3.7c11.3-0.1,22.8-1.2,29.1-3.7 c13.4-5.2,16.5-20,16.5-20c2-8.4,2.7-16.9,2.6-24.4C98.2,42.1,97.5,33.6,95.5,25.2z M68.1,52.5L44.6,67.6c-0.7,0.5-1.5,0.7-2.4,0.7 c-0.7,0-1.4-0.2-2.1-0.5c-1.4-0.8-2.3-2.2-2.3-3.8V33.8c0-1.6,0.9-3.1,2.3-3.8c1.4-0.8,3.1-0.7,4.4,0.2l23.5,15.1 c1.3,0.8,2,2.2,2,3.7S69.4,51.7,68.1,52.5z";

const EXPLORE_OUTLINE_FRAME_PATH =
    "M95.5,25.2c0,0-3.1-14.8-16.5-20c-6.3-2.4-17.8-3.6-29.1-3.7C38.6,1.6,27.1,2.8,20.8,5.2c-13.4,5.2-16.5,20-16.5,20 c-2,8.4-2.7,16.9-2.6,24.4c-0.1,7.5,0.5,16.1,2.6,24.4c0,0,3.1,14.8,16.5,20c6.3,2.4,17.8,3.6,29.1,3.7c11.3-0.1,22.8-1.2,29.1-3.7 c13.4-5.2,16.5-20,16.5-20c2-8.4,2.7-16.9,2.6-24.4C98.2,42.1,97.5,33.6,95.5,25.2z";

export function ExploreIcon({ active, className, ...props }: ExploreIconProps) {
    const isFilled = active ?? Boolean(className?.includes("text-accent"));

    if (isFilled) {
        return React.createElement(
            "svg",
            {
                xmlns: "http://www.w3.org/2000/svg",
                viewBox: "0 0 100 100",
                fill: "currentColor",
                className,
                ...props,
            },
            React.createElement("path", {
                d: EXPLORE_FILLED_PATH,
                fill: "currentColor",
                fillRule: "nonzero",
            })
        );
    }

    return React.createElement(
        "svg",
        {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "-4 -4 108 108",
            fill: "none",
            stroke: "currentColor",
            className,
            ...props,
        },
        React.createElement("path", {
            d: EXPLORE_OUTLINE_FRAME_PATH,
            stroke: "currentColor",
            strokeWidth: "8",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            fill: "none",
        }),
        React.createElement("polygon", {
            points: "42,34 67,50 42,66",
            stroke: "currentColor",
            strokeWidth: "7",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            fill: "none",
        })
    );
}

export function SendIcon({ className, ...props }: ComponentProps<"svg">) {
    return React.createElement(
        "svg",
        {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 110 110",
            fill: "currentColor",
            className,
            ...props,
        },
        React.createElement("path", {
            d: "M103.165599,6.82901971 C101.459384,5.12898109 98.9156851,4.54771788 96.6469808,5.36648649 L9.14874338,36.6171965 C6.79254084,37.4547155 5.1613237,39.6235148 5.01132673,42.1173214 C4.86132975,44.6173782 6.21130255,46.9611815 8.45500735,48.086207 L37.11693,62.4115325 L73.7474421,36.2484381 L47.5792192,72.8867704 L61.9039307,101.549922 C62.9726591,103.66872 65.1413654,105 67.497568,105 C67.6288153,105 67.7538128,104.99375 67.8788103,104.9875 C70.3787599,104.837496 72.5474662,103.212459 73.3911992,100.849906 L104.64057,13.3479178 C105.446803,11.0791163 104.871815,8.53530848 103.165599,6.82901971 Z",
            fill: "currentColor",
            fillRule: "nonzero",
        })
    );
}

export { exploreIcon, sendIcon, temporaryRentIcon };
