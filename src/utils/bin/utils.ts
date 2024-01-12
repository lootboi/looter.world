import * as bin from './index';

export const help = async (args: string[]): Promise<string> => {
  const commands = Object.keys(bin).sort().join(', ');

  return `Available commands:\n${commands}\n\n[enter]\t trigger completion.\n[ctrl+l] clear terminal.\n[ctrl+c] cancel command.`;
};

export const github = async (args: string[]): Promise<string> => {
  return `                                              
Github Link: [click me](https://github.com/lootboi)
`;
};

export const writing = async (args: string[]): Promise<string> => {
  return `
[Making blockchain data go brrrrrrr](https://looter.substack.com/p/making-blockchain-data-go-brrrrrrr?utm_source=profile&utm_medium=reader2)

How to use python and [cryo](https://github.com/paradigmxyz/cryo) to index
and query blockchain data. Code
examples and deep dives into
smart contract event logs.

*more soon :)*
`;
};

export const socials = async (args: string[]): Promise<string> => {
  return `Twitter: [@AltLoot](https://twitter.com/AltLoot)`;
};

export const banner = (args?: string[]): string => {
  return `                                              
    / /                                                
   / /         ___      ___    __  ___  ___      __    
  / /        //   ) ) //   ) )  / /   //___) ) //  ) ) 
 / /        //   / / //   / /  / /   //       //       
/ /____/ / ((___/ / ((___/ /  / /   ((____   //       v1.1.0
------------------------------------------------------------
A collection of my personal projects, thoughts, and opinions
------------------------------------------------------------

*Type 'help' to see list of available commands.
*Try out the 'theme' command!
`;
};
