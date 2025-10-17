import React, { useState } from 'react';

const ElectricalIDE: React.FC = () => {
  const circuitExamples = {
    blank: 'https://www.falstad.com/circuit/circuitjs.html',
    rcCircuit: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgoqoQFMBaMMAKACcQ8RW6GWQBZMzRk0YUgGYJUCkEYhgksdjCgQHAJRwAngAcAliEMAXEIpVqNNgHQqQAWyFHxV8iYCuu18QAOM7vjR3D2ZEbxCLFj4kCJD0HRoAMyQofy4I0OiklMz0-RSAdwhRCuFo70RokCRwrxqGmoRaxsbW-MQEgPdohqaEAEEAZQBlABUAFQGAUQB5AGUAOQBRAcGADRH5ADld3YBdacGATU2pgF1TmcmAbQ2ANgBGAF0AXXXZrcubu6+P7+ufw9W-2BHz+wJBX2mML+CMBzxeJ3RJxRFxO4N+lzxOLxBJRRLJRKp6PppNZmKZlwZzOJnNZ7JJnN5xJ5vP5VNlhJZkqlMvlFNlipJSrFqtJ5OJOrJ+v1suV-K12p12vVOs1VN11KNVOttP1bIttvN1ptTpJtOdrt1Ds9jtJTudUq9Xvdnsdzq95MDvt98rD1sD-qtEfDvtVkdVioT0ZT9vj0cTid9SdT5NT6dTSYLqbT6el8dl2dzmfzqfLJfL-v9Qd9fpj0dr0drCaT5dbIdblernarPabHebvfb-Yr5Z7w5r44bccHwank9Xo7HRbP04HS-nW-Hu9HA7n67vK63p7PK+X86fh-n0-H+5f6-XE83T63j8PV-fb7Pf8fJ83AAfiAb5XggL6vs+EBvrBn4vhBH6wUBX4gTBwH-sBAG-sBYG-ohT7wQhX5wfBQGQdhwEQTBkFQTB0FgV+OEEW+MGwbhEEIdByGwbhCFwfhhGEYBH5oYRhFAA',
    transistorAmp: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgoqoQFMBaMMAKACcQAWIlHkCsSxGG0bMQZEE0QSQAMwgAnRADMAhgBsQumUMaKALmohgkMEfCbGzEAHpfQa5RvIHD1+aWUIGHTy88AJACU3Ly8Ad18-QLY2AFcANwBLLwB3CKcoxwg-T2TfKN98+IDSxNzM0JziuNLs9Ozkuoqq-2qAZWrYkE9HXwHSrt9xiC6Qvr6hqtG-ceHJ4dmFzNXh5ZX1samZ2Y2d4dP9iOOjy+uro+uL7fPLu5vn17iLw8+z-5Obp4i3m9OABXMevD53L7vEC-F5xb4vUG-EG-f7-YFIA',
    halfWaveRectifier: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcMBMcUHYMGZIA4UA2ATmIxAUgoqoQFMBaMMAKACcRcQAWMlnkEfwRs+AJkhgokNgBcQSRAGYATABYhAWyEsxdepAB0GkAFshB8VfLaDEOl+YC6N9xAAOMgeFTXvkb2YHby8WPiQA0OQ6AAsjKF8yRLCHROTk-Myo+wh7bMFkuuhkUIbGlpDWzrbwmsSYlOqs7NLEBtakuqSe9NTe1qbWnt6x-qa+tP7Wqa6hrrGk-rG52f6hxb7hjcGBzeGe-sXFxM2+jeH+0-GB8f2BgfW13YOFvdG9xPj+04TdiYAzM4ALoAXX2ACYVkA',
    logicGates: 'https://www.falstad.com/circuit/circuitjs.html?ctz=CQAgjCAMB0l3BWcA2aAOMB2ALGXyEw1sBsATmIxAUgoqoQFMBaMMAKABkQU9nQAsTCcgmkoWnGQHcpUIhMbMQAOhUgAtlJACQSxAqNB+7lAGYatCgLoNzAZQDKACoAVACIAygDkAogAUAaQA5HQB5AD1gw0MpNgBde00AdQAJAAk6AD0AE0MjAAtvMA8HECdXNwgsqDDq1yCEHKycrCM2rwB3FwKCLKdBcnJWkujSpwAzbLNxzvhggH0DNJMoqYBmFxWU3KNJqABREeOrpzcvNwAPGfc2QuyAbT1aCJ0mZPtLw+Pb65ebl9vf9AYAJqMEABdARYAFwYGHABcKjAYBhMPhr1gCMBcI83mBP2BKhGAF0hkA',
  };

  const [iframeSrc, setIframeSrc] = useState<string>(circuitExamples.blank);

  const loadCircuit = (circuitKey: string) => {
    const src = circuitExamples[circuitKey as keyof typeof circuitExamples];
    setIframeSrc(src);
  };

  return (
    <div className="h-full flex flex-col bg-dark-bg">
      {/* Compact Control Bar */}
      <div className="bg-dark-sidebar border-b border-dark-border px-3 py-2 flex items-center gap-3">
        <span className="text-xs text-gray-400 font-medium">Examples:</span>
        <select
          onChange={(e) => loadCircuit(e.target.value)}
          className="text-xs bg-dark-bg text-gray-300 border border-dark-border rounded px-2 py-1 focus:outline-none focus:border-primary"
        >
          <option value="blank">Blank Canvas</option>
          <option value="rcCircuit">RC Circuit</option>
          <option value="transistorAmp">Transistor Amplifier</option>
          <option value="halfWaveRectifier">Half-Wave Rectifier</option>
          <option value="logicGates">Logic Gates</option>
        </select>
      </div>

      {/* Full-Screen Simulator */}
      <div className="flex-1">
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          className="w-full h-full border-0"
          title="Circuit Simulator"
          allow="clipboard-write"
        />
      </div>
    </div>
  );
};

export default ElectricalIDE;
