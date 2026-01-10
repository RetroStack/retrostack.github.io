import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SingleSelectDropdown } from "../SingleSelectDropdown";

const mockOptions = [
  { value: "option1", label: "Option 1" },
  { value: "option2", label: "Option 2" },
  { value: "option3", label: "Option 3" },
];

const numericOptions = [
  { value: 8, label: "8 columns" },
  { value: 16, label: "16 columns" },
  { value: 32, label: "32 columns" },
];

describe("SingleSelectDropdown", () => {
  it("renders with selected value label", () => {
    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option2"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Option 2");
  });

  it("renders with placeholder when no match found", () => {
    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="nonexistent"
        onChange={jest.fn()}
        placeholder="Select an option"
      />
    );

    expect(screen.getByRole("button")).toHaveTextContent("Select an option");
  });

  it("opens dropdown when button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
      />
    );

    const trigger = screen.getByRole("button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("displays all options in dropdown", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button"));

    const listbox = screen.getByRole("listbox");
    const options = within(listbox).getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Option 1");
    expect(options[1]).toHaveTextContent("Option 2");
    expect(options[2]).toHaveTextContent("Option 3");
  });

  it("marks selected option with aria-selected", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option2"
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button"));

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[2]).toHaveAttribute("aria-selected", "false");
  });

  it("calls onChange with selected value when option is clicked", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={handleChange}
      />
    );

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("option", { name: "Option 3" }));

    expect(handleChange).toHaveBeenCalledWith("option3");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("closes dropdown after selection", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Option 2" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("works with numeric values", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    render(
      <SingleSelectDropdown
        options={numericOptions}
        value={16}
        onChange={handleChange}
      />
    );

    expect(screen.getByRole("button")).toHaveTextContent("16 columns");

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("option", { name: "32 columns" }));

    expect(handleChange).toHaveBeenCalledWith(32);
  });

  it("applies custom className", () => {
    const { container } = render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("applies aria-label to trigger button", () => {
    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
        ariaLabel="Select sorting"
      />
    );

    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Select sorting"
    );
  });

  it("shows empty state when no options provided", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={[]}
        value=""
        onChange={jest.fn()}
        placeholder="Select..."
      />
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByText("No options available")).toBeInTheDocument();
  });

  it("toggles dropdown open/closed on repeated clicks", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
      />
    );

    const trigger = screen.getByRole("button");

    // First click opens
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    // Second click closes
    await user.click(trigger);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("supports empty string as a valid value", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();

    const optionsWithAll = [
      { value: "", label: "All options" },
      ...mockOptions,
    ];

    render(
      <SingleSelectDropdown
        options={optionsWithAll}
        value=""
        onChange={handleChange}
      />
    );

    expect(screen.getByRole("button")).toHaveTextContent("All options");

    await user.click(screen.getByRole("button"));
    const allOption = screen.getByRole("option", { name: "All options" });
    expect(allOption).toHaveAttribute("aria-selected", "true");

    await user.click(screen.getByRole("option", { name: "Option 1" }));
    expect(handleChange).toHaveBeenCalledWith("option1");
  });

  it("highlights selected option with correct styling", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option2"
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button"));

    const selectedOption = screen.getByRole("option", { name: "Option 2" });
    expect(selectedOption).toHaveClass("bg-retro-cyan/10");
    expect(selectedOption).toHaveClass("text-retro-cyan");
  });

  it("applies hover styles to unselected options", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button"));

    const unselectedOption = screen.getByRole("option", { name: "Option 2" });
    expect(unselectedOption).toHaveClass("text-gray-300");
    expect(unselectedOption).toHaveClass("hover:bg-retro-purple/20");
  });

  it("shows checkmark icon for selected option", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option2"
        onChange={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button"));

    const selectedOption = screen.getByRole("option", { name: "Option 2" });
    const checkmark = selectedOption.querySelector("svg");
    expect(checkmark).toBeInTheDocument();
  });

  it("rotates chevron when dropdown is open", async () => {
    const user = userEvent.setup();

    render(
      <SingleSelectDropdown
        options={mockOptions}
        value="option1"
        onChange={jest.fn()}
      />
    );

    const trigger = screen.getByRole("button");
    const chevron = trigger.querySelector("svg");

    expect(chevron).not.toHaveClass("rotate-180");

    await user.click(trigger);

    expect(chevron).toHaveClass("rotate-180");
  });
});
