"use client";

import * as React from "react";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "@/lib/button-classes";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      className = "",
      disabled,
      asChild = false,
      children,
      ...props
    },
    _ref,
  ) {
    const classes = buttonClasses(variant, size, className);

    if (asChild) {
      const validChildren = React.Children.toArray(children).filter(
        React.isValidElement,
      ) as React.ReactElement[];
      if (validChildren.length !== 1) {
        throw new Error(
          "Button with asChild expects exactly one React element child.",
        );
      }
      const child = validChildren[0] as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        ...child.props,
        ...props,
        className: `${classes} ${(child.props.className as string | undefined) ?? ""}`.trim(),
      });
    }

    return (
      <button ref={_ref} disabled={disabled} className={classes} {...props}>
        {children}
      </button>
    );
  },
);
